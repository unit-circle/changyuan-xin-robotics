#!/usr/bin/env python3
"""Generate structured web snapshots from the bilingual LaTeX textbook.

This script is the single source-to-site pipeline. It reads the known macros
and environments, expands bilingual helpers, preserves math, copies raster
figures, and renders TikZ fragments to browser-safe PNG files with the local
TeX Live toolchain. PNG is intentional here: dvisvgm can collapse TeX line
breaks in bilingual nodes onto one baseline, producing overlapping glyphs.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path


DEFAULT_SOURCE = Path(r"E:\codex\projects\My-robotics-book-Chinese-and-English")
SITE_ROOT = Path(__file__).resolve().parents[1]
PUBLIC_ROOT = SITE_ROOT / "public" / "textbook"
MEDIA_ROOT = PUBLIC_ROOT / "media"
MANIFEST_MODULE = SITE_ROOT / "lib" / "textbook-manifest.ts"
TEXLIVE_BIN = Path(r"D:\LaTex\Texlive\texlive\2025\bin\windows")
EDITIONS = ("zh", "en", "dual")

# Only chapters that have passed the current Part 1 content gate are readable
# on the PhD site. The full map stays visible; the rest render as "整理中".
PUBLISHED_CHAPTERS = {
    "00-guide",
    "01-foundations",
    "01a-numbers-units-expressions",
    "06-scientific-python",
    "04-algebra-trigonometry",
    "02-vectors-matrices-frames",
    "03-functions-derivatives-jacobians",
    "05-probability-statistics",
    "08-optimization-basics",
}

CALLOUT_TONES = {
    "leadbox": "lead",
    "conceptbox": "concept",
    "bridgebox": "bridge",
    "applicationbox": "application",
    "failurebox": "failure",
    "evidencebox": "evidence",
    "notebox": "note",
    "englishbox": "english",
}

FIGURE_PREAMBLE = r"""\documentclass[border=3pt]{standalone}
\usepackage{fontspec}
\usepackage{xeCJK}
\setmainfont{Arial}
\setCJKmainfont[Path=C:/Windows/Fonts/,AutoFakeBold=2.0]{NotoSerifSC-VF.ttf}
\setCJKsansfont[Path=C:/Windows/Fonts/,AutoFakeBold=2.0]{NotoSansSC-VF.ttf}
\usepackage{xcolor}
\definecolor{Ink}{HTML}{14243B}
\definecolor{Teal}{HTML}{087F8C}
\definecolor{Cyan}{HTML}{4299A3}
\definecolor{Amber}{HTML}{D79216}
\definecolor{Coral}{HTML}{D96C5F}
\definecolor{Green}{HTML}{3D9970}
\definecolor{PaleTeal}{HTML}{EAF5F5}
\definecolor{PaleAmber}{HTML}{FFF4DC}
\definecolor{PaleCoral}{HTML}{FCEBE8}
\definecolor{PaleBlue}{HTML}{EAF2F8}
\definecolor{Lav}{HTML}{F0EDF8}
\definecolor{Mist}{HTML}{F3F6F8}
\definecolor{Gray}{HTML}{687482}
\definecolor{Rule}{HTML}{CBD3DA}
\usepackage{tikz}
\usetikzlibrary{arrows.meta,positioning,calc,fit,backgrounds,shapes.geometric,matrix}
\usepackage{amsmath,amssymb,mathtools,bm}
\begin{document}
%BODY%
\end{document}
"""


def block(kind: str, **values: object) -> dict[str, object]:
    return {"type": kind, **values}


def balanced(text: str, start: int) -> tuple[str, int] | None:
    while start < len(text) and text[start].isspace():
        start += 1
    if start >= len(text) or text[start] != "{":
        return None
    depth = 0
    pos = start
    while pos < len(text):
        char = text[pos]
        if char == "\\":
            pos += 2
            continue
        if char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                return text[start + 1 : pos], pos + 1
        pos += 1
    return None


def macro_args(text: str, pos: int, count: int) -> tuple[list[str], int] | None:
    args: list[str] = []
    for _ in range(count):
        parsed = balanced(text, pos)
        if parsed is None:
            return None
        args.append(parsed[0])
        pos = parsed[1]
    return args, pos


def choose(zh: str, en: str, edition: str) -> str:
    if edition == "zh":
        return zh
    if edition == "en":
        return en
    return f"{zh}\n\n{en}"


def expand_language_macros(text: str, edition: str) -> str:
    pairs = {"B": (0, 1), "T": (0, 1), "LangText": (1, 0)}
    result: list[str] = []
    cursor = 0
    for match in re.finditer(r"\\(B|T|LangText)\b", text):
        result.append(text[cursor : match.start()])
        zh_index, en_index = pairs[match.group(1)]
        parsed = macro_args(text, match.end(), 2)
        if parsed is None:
            result.append(match.group(0))
            cursor = match.end()
            continue
        args, end = parsed
        result.append(choose(args[zh_index], args[en_index], edition))
        cursor = end
    result.append(text[cursor:])
    return "".join(result)


def clean_inline(value: str) -> str:
    protected: list[str] = []

    def protect(match: re.Match[str]) -> str:
        protected.append(match.group(0))
        return f"@@MATH{len(protected) - 1}@@"

    value = re.sub(r"\$[^$]+\$|\\\([\s\S]*?\\\)", protect, value)
    value = re.sub(r"\s+", " ", value).strip()
    for old, new in {
        r"\%": "%", r"\_": "_", r"\&": "&", "~": " ",
        r"\#": "#",
        r"\qquad": "  ", r"\quad": " ", r"\,": " ", r"\;": " ", r"\ ": " ",
    }.items():
        value = value.replace(old, new)
    value = re.sub(r"\\(?:begin|end)\{[^{}]*\}(?:\[[^]]*\])?", "", value)
    value = re.sub(r"\\caption(?:\[[^]]*\])?\{[^{}]*\}", "", value)
    value = re.sub(r"\\centering|\\small|\\footnotesize|\\raggedright|\\raggedleft", "", value)
    for command in ("textbf", "textit", "emph", "texttt", "small", "mathrm", "text", "bm"):
        value = re.sub(rf"\\{command}\{{([^{{}}]*)\}}", r"\1", value)
    value = re.sub(r"\\href\{([^{}]+)\}\{([^{}]+)\}", r"\2", value)
    value = re.sub(r"\\code\{([^{}]+)\}", r"`\1`", value)
    value = re.sub(r"\\path\{([^{}]+)\}", r"`\1`", value)
    value = re.sub(r"\\label\{[^{}]+\}", "", value)
    value = re.sub(r"\\(?:ref|pageref)\{([^{}]+)\}", r"\1", value)
    value = re.sub(r"\\[a-zA-Z@]+\*?(?:\[[^]]*\])?", "", value)
    value = value.replace("{", "").replace("}", "")
    for index, math_value in enumerate(protected):
        value = value.replace(f"@@MATH{index}@@", math_value)
    return value.strip()


def split_row(row: str) -> list[str]:
    cells: list[str] = []
    current: list[str] = []
    depth = 0
    math_mode = False
    pos = 0
    while pos < len(row):
        char = row[pos]
        if char == "\\" and pos + 1 < len(row):
            current.append(char + row[pos + 1])
            pos += 2
            continue
        if char == "$":
            math_mode = not math_mode
            current.append(char)
            pos += 1
            continue
        if char == "{" and not math_mode:
            depth += 1
        elif char == "}" and not math_mode:
            depth -= 1
        if char == "&" and depth == 0 and not math_mode:
            cells.append("".join(current).strip())
            current = []
        else:
            current.append(char)
        pos += 1
    cells.append("".join(current).strip())
    return cells


@dataclass
class TikzRenderer:
    source: Path

    def render(self, tikz_body: str, name_hint: str) -> str | None:
        digest = hashlib.sha1(tikz_body.encode("utf-8")).hexdigest()[:12]
        target_name = f"{name_hint}-{digest}.png"
        public_path = MEDIA_ROOT / "figures" / target_name
        if public_path.exists():
            return f"/textbook/media/figures/{target_name}"
        workdir = self.source.parent / "build" / "web-figures" / digest
        workdir.mkdir(parents=True, exist_ok=True)
        (workdir / "figure.tex").write_text(FIGURE_PREAMBLE.replace("%BODY%", tikz_body), encoding="utf-8")
        xelatex = TEXLIVE_BIN / "xelatex.exe"
        result = subprocess.run(
            [str(xelatex), "-interaction=nonstopmode", "-halt-on-error", "figure.tex"],
            cwd=workdir, capture_output=True, text=True,
        )
        if result.returncode != 0 or not (workdir / "figure.pdf").exists():
            print(f"  tikz render failed: {name_hint}", file=sys.stderr)
            return None
        subprocess.run(
            [str(TEXLIVE_BIN / "pdftocairo.exe"), "-png", "-singlefile", "-r", "180", "figure.pdf", "figure"],
            cwd=workdir, capture_output=True, text=True,
        )
        png_file = workdir / "figure.png"
        if not png_file.exists():
            return None
        public_path.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(png_file, public_path)
        return f"/textbook/media/figures/{target_name}"


def copy_raster(token: str, source: Path, copied: set[str]) -> str | None:
    raw = source / token
    candidates = [raw] if raw.suffix else [raw.with_suffix(ext) for ext in (".png", ".jpg", ".jpeg", ".webp")]
    actual = next((path for path in candidates if path.exists() and path.suffix.lower() != ".pdf"), None)
    if actual is None:
        return None
    relative = actual.relative_to(source).as_posix()
    target = MEDIA_ROOT / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    if relative not in copied:
        shutil.copy2(actual, target)
        copied.add(relative)
    return f"/textbook/media/{relative}"


def parse_table(body: str) -> dict[str, object]:
    # Remove the tabular preamble such as {0.94\textwidth}{column spec}.
    stripped = body
    while stripped.lstrip().startswith("{"):
        parsed = balanced(stripped, stripped.find("{"))
        if parsed is None:
            break
        stripped = stripped[parsed[1] :]
    stripped = re.sub(r"\\(?:toprule|midrule|bottomrule|hline)\s*", "", stripped)
    headers: list[list[str]] = []
    rows: list[list[str]] = []
    for raw_row in re.split(r"\\\\", stripped):
        row = raw_row.strip()
        if not row:
            continue
        cells = [clean_inline(cell) for cell in split_row(row)]
        cells = [cell for cell in cells if cell]
        if cells:
            if not headers:
                headers.append(cells)
            else:
                rows.append(cells)
    return block("table", headers=headers, rows=rows)


def parse_list(body: str, ordered: bool) -> dict[str, object]:
    items = [clean_inline(item) for item in re.split(r"\\item", body)[1:]]
    return block("list", ordered=ordered, items=[item for item in items if item])


def parse_figure(
    body: str,
    source: Path,
    copied: set[str],
    tikz: TikzRenderer,
) -> dict[str, object] | None:
    caption = ""
    caption_pos = body.find("\\caption")
    if caption_pos >= 0:
        parsed = balanced(body, caption_pos + len("\\caption"))
        if parsed:
            caption = clean_inline(parsed[0])
    graphic = re.search(r"\\includegraphics(?:\[[^]]*\])?\{([^{}]+)\}", body)
    if graphic:
        src = copy_raster(graphic.group(1), source, copied)
        return block("figure", src=src, caption=caption) if src else None
    input_match = re.search(r"\\input\{([^{}]+)\}", body)
    if input_match:
        token = input_match.group(1)
        fig_file = source / token
        if not fig_file.suffix:
            fig_file = fig_file.with_suffix(".tex")
        if fig_file.exists():
            src = tikz.render(fig_file.read_text(encoding="utf-8"), fig_file.stem)
            if src:
                return block("figure", src=src, caption=caption)
    return None


def parse_blocks(
    text: str,
    edition: str,
    source: Path,
    copied: set[str],
    tikz: TikzRenderer,
) -> list[dict[str, object]]:
    text = re.sub(r"(?m)^%.*$", "", text)
    text = re.sub(
        r"\\chaptertitle\{(?:[^{}]|\{[^{}]*\})*\}\{(?:[^{}]|\{[^{}]*\})*\}",
        "", text, count=1,
    )
    text = expand_language_macros(text, edition)
    blocks: list[dict[str, object]] = []

    token_re = re.compile(
        r"(?P<section>\\sectiontitle)|(?P<subsection>\\subsectiontitle)|"
        r"(?P<lstinput>\\lstinputlisting)|(?P<listing>\\begin\{lstlisting\})|"
        r"(?P<math>\\begin\{(?:equation\*?|align\*?|multline\*?|gather\*?)\})|"
        r"(?P<display>\\\[)|(?P<figure>\\begin\{figure\})|"
        r"(?P<tikz>\\begin\{tikzpicture\})|"
        r"(?P<callout>\\begin\{(?:leadbox|conceptbox|bridgebox|applicationbox|failurebox|evidencebox|notebox|englishbox)\})|"
        r"(?P<table>\\begin\{(?:tabularx|tabular|longtable)\})|"
        r"(?P<list>\\begin\{(?:enumerate|itemize)\})|"
        r"(?P<chapterroute>\\chapterroute)|(?P<stateband>\\stateband)|"
        r"(?P<conceptformula>\\conceptformula)|(?P<checkpoint>\\checkpoint)|"
        r"(?P<researchexit>\\researchexit)"
    )
    cursor = 0

    def paragraph(raw: str) -> None:
        for piece in re.split(r"\n\s*\n", raw):
            cleaned = clean_inline(piece)
            if cleaned and not cleaned.startswith(("\\begin", "\\end")):
                blocks.append(block("paragraph", text=cleaned))

    while cursor < len(text):
        match = token_re.search(text, cursor)
        if match is None:
            paragraph(text[cursor:])
            break
        paragraph(text[cursor : match.start()])
        kind = match.lastgroup
        assert kind is not None

        if kind in ("section", "subsection"):
            parsed = macro_args(text, match.end(), 2)
            if parsed is None:
                cursor = match.end()
                continue
            values, cursor = parsed
            level = 2 if kind == "section" else 3
            blocks.append(block("heading", level=level, text=clean_inline(choose(values[0], values[1], edition))))
            continue

        if kind == "lstinput":
            pos = match.end()
            options = ""
            if pos < len(text) and text[pos] == "[":
                close = text.find("]", pos)
                options = text[pos + 1 : close] if close >= 0 else ""
                pos = close + 1 if close >= 0 else pos
            parsed = balanced(text, pos)
            if parsed is None:
                cursor = match.end()
                continue
            token, cursor = parsed
            code_file = source / token
            code = code_file.read_text(encoding="utf-8", errors="replace") if code_file.exists() else f"# Missing source: {token}"
            caption_match = re.search(r"caption=\{([^{}]*)\}", options)
            blocks.append(block("code", language="python", caption=clean_inline(caption_match.group(1)) if caption_match else token, code=code))
            continue

        if kind == "listing":
            start = match.end()
            if start < len(text) and text[start] == "[":
                close_opt = text.find("]", start)
                if close_opt >= 0:
                    start = close_opt + 1
            close = text.find("\\end{lstlisting}", start)
            code = text[start : close if close >= 0 else len(text)].strip("\n")
            blocks.append(block("code", language="python", caption="", code=code))
            cursor = close + len("\\end{lstlisting}") if close >= 0 else len(text)
            continue

        if kind in ("math", "display"):
            opener = match.group(0)
            env_match = re.search(r"\\begin\{([^}]+)\}", opener)
            closer = f"\\end{{{env_match.group(1)}}}" if env_match else "\\]"
            close = text.find(closer, match.end())
            latex = text[match.end() : close if close >= 0 else len(text)].strip()
            blocks.append(block("math", latex=latex))
            cursor = close + len(closer) if close >= 0 else len(text)
            continue

        if kind == "figure":
            close = text.find("\\end{figure}", match.end())
            body = text[match.end() : close if close >= 0 else len(text)]
            parsed_figure = parse_figure(body, source, copied, tikz)
            if parsed_figure:
                blocks.append(parsed_figure)
            cursor = close + len("\\end{figure}") if close >= 0 else len(text)
            continue

        if kind == "tikz":
            close = text.find("\\end{tikzpicture}", match.end())
            end = close + len("\\end{tikzpicture}") if close >= 0 else len(text)
            body = text[match.start() : end]
            src = tikz.render(body, "inline")
            if src:
                blocks.append(block("figure", src=src, caption=""))
            cursor = end
            continue

        if kind == "callout":
            env_match = re.search(r"\\begin\{([^}]+)\}", match.group(0))
            env = env_match.group(1)
            close_token = f"\\end{{{env}}}"
            close = text.find(close_token, match.end())
            body = text[match.end() : close if close >= 0 else len(text)]
            tone = CALLOUT_TONES.get(env, "note")
            title = ""
            inner = body
            title_match = re.match(r"\s*\[title=([^\]]+)\]", body)
            if title_match:
                title = clean_inline(title_match.group(1))
                inner = body[title_match.end() :]
            nested = parse_blocks(inner, edition, source, copied, tikz)
            blocks.append(block("callout", tone=tone, title=title, blocks=nested))
            cursor = close + len(close_token) if close >= 0 else len(text)
            continue

        if kind == "table":
            env_match = re.search(r"\\begin\{([^}]+)\}", match.group(0))
            env = env_match.group(1)
            close_token = f"\\end{{{env}}}"
            close = text.find(close_token, match.end())
            body = text[match.end() : close if close >= 0 else len(text)]
            blocks.append(parse_table(body))
            cursor = close + len(close_token) if close >= 0 else len(text)
            continue

        if kind == "list":
            env = "enumerate" if "enumerate" in match.group(0) else "itemize"
            close_token = f"\\end{{{env}}}"
            close = text.find(close_token, match.end())
            body = text[match.end() : close if close >= 0 else len(text)]
            blocks.append(parse_list(body, env == "enumerate"))
            cursor = close + len(close_token) if close >= 0 else len(text)
            continue

        if kind == "chapterroute":
            parsed = macro_args(text, match.end(), 5)
            if parsed is None:
                cursor = match.end()
                continue
            values, cursor = parsed
            blocks.append(block("route", items=[clean_inline(value) for value in values]))
            continue

        if kind == "stateband":
            parsed = macro_args(text, match.end(), 3)
            if parsed is None:
                cursor = match.end()
                continue
            values, cursor = parsed
            blocks.append(block("state", cells=[clean_inline(value) for value in values]))
            continue

        if kind == "conceptformula":
            parsed = macro_args(text, match.end(), 3)
            if parsed is None:
                cursor = match.end()
                continue
            values, cursor = parsed
            blocks.append(block("formula", left=clean_inline(values[0]), right=clean_inline(values[1]), note=clean_inline(values[2])))
            continue

        if kind in ("checkpoint", "researchexit"):
            parsed = balanced(text, match.end())
            if parsed is None:
                cursor = match.end()
                continue
            value, cursor = parsed
            blocks.append(block(kind, text=clean_inline(value)))
            continue

    return blocks


def parse_catalog(path: Path) -> list[dict[str, object]]:
    items: list[dict[str, object]] = []
    current: dict[str, object] | None = None
    routes = False
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.startswith("  - order:"):
            if current:
                items.append(current)
            current = {"order": int(line.split(":", 1)[1].strip()), "routes": {}}
            routes = False
        elif current is not None and line.startswith("    routes:"):
            routes = True
        elif current is not None and routes and line.startswith("      "):
            key, value = line.strip().split(":", 1)
            current["routes"][key] = json.loads(value.strip())
        elif current is not None and line.startswith("    "):
            key, value = line.strip().split(":", 1)
            current[key] = json.loads(value.strip())
    if current:
        items.append(current)
    return items


def write_snapshot(source: Path) -> None:
    catalog = parse_catalog(source / "catalog" / "chapters.yml")
    if not catalog:
        raise SystemExit("No chapters found in catalog")
    if MEDIA_ROOT.exists():
        shutil.rmtree(MEDIA_ROOT)
    MEDIA_ROOT.mkdir(parents=True)
    content_root = PUBLIC_ROOT / "content"
    if content_root.exists():
        shutil.rmtree(content_root)
    content_root.mkdir()

    copied: set[str] = set()
    tikz = TikzRenderer(source)
    manifest: list[dict[str, object]] = []
    searches: dict[str, list[dict[str, str]]] = {edition: [] for edition in EDITIONS}

    for chapter in catalog:
        slug = str(chapter["slug"])
        status = "published" if slug in PUBLISHED_CHAPTERS else "placeholder"
        record = {
            "order": chapter["order"],
            "id": chapter["id"],
            "slug": slug,
            "part": chapter["part"],
            "partTitleZh": chapter["part_title_zh"],
            "partTitleEn": chapter["part_title_en"],
            "titleZh": chapter["title_zh"],
            "titleEn": chapter["title_en"],
            "status": status,
        }
        manifest.append(record)
        if status != "published":
            continue

        source_file = source / str(chapter["source"])
        raw = source_file.read_text(encoding="utf-8")
        for edition in EDITIONS:
            blocks = parse_blocks(raw, edition, source, copied, tikz)
            title = choose(str(chapter["title_zh"]), str(chapter["title_en"]), edition)
            payload = {**record, "edition": edition, "title": title, "blocks": blocks}
            directory = content_root / edition
            directory.mkdir(exist_ok=True)
            (directory / f"{slug}.json").write_text(
                json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"
            )
            plain = " ".join(
                str(item.get("text") or item.get("caption") or "") for item in blocks
            )
            searches[edition].append(
                {"slug": slug, "title": title, "part": choose(str(chapter["part_title_zh"]), str(chapter["part_title_en"]), edition), "text": plain[:12000]}
            )

    public_manifest = {
        "version": 2,
        "chapterCount": len(manifest),
        "publishedCount": sum(1 for item in manifest if item["status"] == "published"),
        "editions": list(EDITIONS),
        "chapters": manifest,
    }
    (PUBLIC_ROOT / "manifest.json").write_text(
        json.dumps(public_manifest, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"
    )
    for edition, entries in searches.items():
        (PUBLIC_ROOT / f"search-{edition}.json").write_text(
            json.dumps(entries, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"
        )
    MANIFEST_MODULE.write_text(
        "// Generated by scripts/generate-textbook-site.py; do not edit.\n"
        f"export const textbookManifest = {json.dumps(public_manifest, ensure_ascii=False, indent=2)} as const;\n",
        encoding="utf-8",
    )
    print(
        f"Generated {public_manifest['publishedCount']} published of "
        f"{public_manifest['chapterCount']} chapters x {len(EDITIONS)} editions; "
        f"copied {len(copied)} raster figures."
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    args = parser.parse_args()
    write_snapshot(args.source.resolve())


if __name__ == "__main__":
    main()
