import { textbookManifest } from "@/lib/textbook-manifest";

export type Edition = "zh" | "en" | "dual";
export type TextbookChapter = (typeof textbookManifest.chapters)[number];

export const editions: { id: Edition; label: string; short: string }[] = [
  { id: "zh", label: "中文版", short: "中" },
  { id: "en", label: "English edition", short: "EN" },
  { id: "dual", label: "中英对照版", short: "中 / EN" },
];

export const textbookChapters = textbookManifest.chapters;
export const publishedChapters = textbookChapters.filter(
  (chapter) => chapter.status === "published",
);
export const isEdition = (value: string): value is Edition =>
  editions.some((edition) => edition.id === value);
export const isPublished = (chapter: TextbookChapter) =>
  chapter.status === "published";

export function chapterTitle(chapter: TextbookChapter, edition: Edition) {
  if (edition === "en") return chapter.titleEn;
  if (edition === "dual") return `${chapter.titleZh} / ${chapter.titleEn}`;
  return chapter.titleZh;
}

export function groupChapters() {
  const groups = new Map<string, { id: string; titleZh: string; titleEn: string; chapters: TextbookChapter[] }>();
  for (const chapter of textbookChapters) {
    const group = groups.get(chapter.part) ?? {
      id: chapter.part,
      titleZh: chapter.partTitleZh,
      titleEn: chapter.partTitleEn,
      chapters: [],
    };
    group.chapters.push(chapter);
    groups.set(chapter.part, group);
  }
  return [...groups.values()];
}

export const textbookLinks = {
  source:
    "https://github.com/unit-circle/My-robotics-book-Chinese-and-English",
};
