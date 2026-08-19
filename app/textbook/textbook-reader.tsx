"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  chapterTitle,
  editions,
  groupChapters,
  textbookChapters,
  type Edition,
} from "@/lib/textbook";

type Block = {
  type: string;
  text?: string;
  title?: string;
  tone?: string;
  level?: number;
  latex?: string;
  code?: string;
  language?: string;
  caption?: string;
  src?: string;
  items?: string[];
  ordered?: boolean;
  headers?: string[][];
  rows?: string[][];
  cells?: string[];
  left?: string;
  right?: string;
  note?: string;
  blocks?: Block[];
};

type ChapterContent = { title: string; blocks: Block[] };
type SearchItem = { slug: string; title: string; part: string; text: string };

export function TextbookReader({
  edition,
  slug,
  chapterIndex,
}: {
  edition: Edition;
  slug: string;
  chapterIndex: number;
}) {
  const [content, setContent] = useState<ChapterContent | null>(null);
  const [filter, setFilter] = useState("");
  const [searchItems, setSearchItems] = useState<SearchItem[] | null>(null);
  const [drawer, setDrawer] = useState(false);
  const articleRef = useRef<HTMLElement>(null);
  const chapter = textbookChapters[chapterIndex];
  const parts = useMemo(() => groupChapters(), []);
  const normalized = filter.trim().toLocaleLowerCase();

  useEffect(() => {
    let active = true;
    fetch(`/textbook/content/${edition}/${slug}.json`)
      .then((response) => response.json())
      .then((data: ChapterContent) => active && setContent(data));
    return () => {
      active = false;
    };
  }, [edition, slug]);

  useEffect(() => {
    if (!normalized || searchItems) return;
    fetch(`/textbook/search-${edition}.json`)
      .then((response) => response.json())
      .then(setSearchItems);
  }, [edition, normalized, searchItems]);

  useEffect(() => {
    if (!content || !articleRef.current) return;
    const node = articleRef.current;
    const typeset = () => window.MathJax?.typesetPromise?.([node]);
    if (window.MathJax?.typesetPromise) {
      typeset();
      return;
    }
    const config = document.createElement("script");
    config.textContent =
      'window.MathJax={tex:{inlineMath:[["$","$"]]},options:{skipHtmlTags:["script","noscript","style","textarea","pre","code"]}};';
    document.head.appendChild(config);
    const existing = document.querySelector<HTMLScriptElement>(
      "script[data-textbook-mathjax]",
    );
    if (existing) {
      existing.addEventListener("load", typeset, { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js";
    script.async = true;
    script.dataset.textbookMathjax = "true";
    script.onload = typeset;
    document.head.appendChild(script);
  }, [content]);

  const matches =
    normalized && searchItems
      ? searchItems
          .filter((item) =>
            `${item.title} ${item.text}`.toLocaleLowerCase().includes(normalized),
          )
          .slice(0, 30)
      : null;
  const previous = textbookChapters[chapterIndex - 1];
  const next = textbookChapters[chapterIndex + 1];

  const sidebar = (
    <aside className="textbook-sidebar">
      <Link className="textbook-back" href="/textbook">
        ← 教材总目录
      </Link>
      <label className="textbook-search">
        <span>搜索已发布章节</span>
        <input
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          placeholder="标题、概念或方法"
        />
      </label>
      <nav aria-label="Textbook chapters">
        {matches
          ? matches.map((item) => (
              <Link
                className={item.slug === slug ? "active" : ""}
                href={`/textbook/${edition}/${item.slug}`}
                onClick={() => setDrawer(false)}
                key={item.slug}
              >
                <small>{item.part}</small>
                {item.title}
              </Link>
            ))
          : parts.map((part, index) => (
              <details open={part.id === chapter.part} key={part.id}>
                <summary>
                  <b>{String(index + 1).padStart(2, "0")}</b>
                  <span>{edition === "en" ? part.titleEn : part.titleZh}</span>
                  <small>{part.chapters.length}</small>
                </summary>
                <div>
                  {part.chapters.map((item) => (
                    <Link
                      className={`${item.slug === slug ? "active" : ""} ${
                        item.status !== "published" ? "is-placeholder" : ""
                      }`}
                      href={`/textbook/${edition}/${item.slug}`}
                      onClick={() => setDrawer(false)}
                      key={item.slug}
                    >
                      <i>{item.order}</i>
                      {chapterTitle(item, edition)}
                    </Link>
                  ))}
                </div>
              </details>
            ))}
      </nav>
    </aside>
  );

  return (
    <div className="textbook-reader-shell">
      <button className="textbook-drawer-button" onClick={() => setDrawer(true)}>
        ☰ 目录与搜索
      </button>
      <div className={`textbook-drawer ${drawer ? "open" : ""}`}>
        <button onClick={() => setDrawer(false)} aria-label="Close chapter navigation">
          ×
        </button>
        {sidebar}
      </div>
      <div className="textbook-sidebar-desktop">{sidebar}</div>
      <section className="textbook-reading-column">
        <header className="textbook-chapter-header">
          <div>
            <span>
              CHAPTER {String(chapter.order).padStart(3, "0")} / {textbookChapters.length}
            </span>
            <p>{edition === "en" ? chapter.partTitleEn : chapter.partTitleZh}</p>
          </div>
          <div className="textbook-edition-switcher">
            {editions.map((item) => (
              <Link
                className={item.id === edition ? "active" : ""}
                href={`/textbook/${item.id}/${slug}`}
                key={item.id}
              >
                {item.short}
              </Link>
            ))}
          </div>
          <h1 className={edition === "dual" ? "textbook-dual-title" : undefined}>
            {edition === "dual" ? (
              <>
                <span className="textbook-title-zh">{chapter.titleZh}</span>
                <span className="textbook-title-en">{chapter.titleEn}</span>
              </>
            ) : chapterTitle(chapter, edition)}
          </h1>
        </header>
        <article className="textbook-article" ref={articleRef}>
          {!content ? (
            <p className="textbook-loading">正在载入本章…</p>
          ) : (
            content.blocks.map((item, index) => (
              <TextbookBlock block={item} key={`${item.type}-${index}`} />
            ))
          )}
        </article>
        <nav className="textbook-pager" aria-label="Chapter pagination">
          {previous ? (
            <Link href={`/textbook/${edition}/${previous.slug}`}>
              <small>上一章</small>
              <span>← {chapterTitle(previous, edition)}</span>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link href={`/textbook/${edition}/${next.slug}`}>
              <small>下一章</small>
              <span>{chapterTitle(next, edition)} →</span>
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </section>
    </div>
  );
}

function TextbookBlock({ block }: { block: Block }) {
  if (block.type === "heading") {
    const Tag = block.level === 3 ? "h3" : "h2";
    return <Tag>{block.text}</Tag>;
  }
  if (block.type === "math") {
    return <div className="textbook-math">{`\\[${block.latex ?? ""}\\]`}</div>;
  }
  if (block.type === "code") {
    return <CodeBlock block={block} />;
  }
  if (block.type === "figure") {
    return (
      <figure className="textbook-figure">
        <img src={block.src} alt={block.caption || "Textbook figure"} loading="lazy" />
        {block.caption ? <figcaption>{block.caption}</figcaption> : null}
      </figure>
    );
  }
  if (block.type === "callout") {
    return (
      <aside className={`textbook-callout ${block.tone ?? "note"}`}>
        {block.title ? <strong>{block.title}</strong> : null}
        <div className="textbook-callout-body">
          {block.blocks?.map((item, index) => (
            <TextbookBlock block={item} key={index} />
          ))}
        </div>
      </aside>
    );
  }
  if (block.type === "list") {
    const Tag = block.ordered ? "ol" : "ul";
    return (
      <Tag>
        {block.items?.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </Tag>
    );
  }
  if (block.type === "table") {
    return (
      <div className="textbook-table-wrap">
        <table className="textbook-table">
          {block.headers?.length ? (
            <thead>
              {block.headers.map((row, index) => (
                <tr key={index}>
                  {row.map((cell, cellIndex) => (
                    <th key={cellIndex}>{cell}</th>
                  ))}
                </tr>
              ))}
            </thead>
          ) : null}
          <tbody>
            {block.rows?.map((row, index) => (
              <tr key={index}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  if (block.type === "formula") {
    return (
      <div className="textbook-formula">
        <span className="textbook-formula-left">{block.left}</span>
        <span className="textbook-formula-sep">⇔</span>
        <span className="textbook-formula-right">{block.right}</span>
        {block.note ? <small>{block.note}</small> : null}
      </div>
    );
  }
  if (block.type === "route") {
    return (
      <ol className="textbook-route">
        {block.items?.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ol>
    );
  }
  if (block.type === "state") {
    return (
      <div className="textbook-state">
        {block.cells?.map((cell, index) => (
          <span key={index}>{cell}</span>
        ))}
      </div>
    );
  }
  if (block.type === "checkpoint") {
    return (
      <aside className="textbook-callout checkpoint">
        <strong>完成检查</strong>
        <p>{block.text}</p>
      </aside>
    );
  }
  if (block.type === "researchexit") {
    return (
      <aside className="textbook-callout researchexit">
        <strong>本章出口</strong>
        <p>{block.text}</p>
      </aside>
    );
  }
  const parts = block.text?.split(/\n{2,}/) ?? [];
  if (parts.length <= 1) return <p>{block.text}</p>;
  return (
    <div className="textbook-bilingual">
      {parts.map((part, index) => (
        <p key={index}>{part}</p>
      ))}
    </div>
  );
}

function CodeBlock({ block }: { block: Block }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    if (!block.code) return;
    await navigator.clipboard.writeText(block.code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };
  return (
    <figure className="textbook-code">
      <figcaption>
        <span className="textbook-code-title">
          <i aria-hidden="true" />
          <b>{block.caption || "运行示例"}</b>
          <small>{(block.language || "text").toUpperCase()}</small>
        </span>
        <button type="button" onClick={copy} aria-label="Copy code" className="textbook-code-copy">
          {copied ? "已复制" : "复制"}
        </button>
      </figcaption>
      <pre>
        <code>{(block.code || "").split("\n").map((line, index) => (
          <span className="textbook-code-line" key={`${index}-${line}`}>
            <span className="textbook-code-number" aria-hidden="true">{index + 1}</span>
            <span className="textbook-code-text">{line || " "}</span>
          </span>
        ))}</code>
      </pre>
    </figure>
  );
}

declare global {
  interface Window {
    MathJax?: {
      typesetPromise?: (nodes?: HTMLElement[]) => Promise<void>;
    };
  }
}
