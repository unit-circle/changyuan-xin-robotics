import { notFound } from "next/navigation";
import { SiteHeader } from "@/app/components/site-header";
import { SiteFooter } from "@/app/components/site-footer";
import { TextbookReader } from "@/app/textbook/textbook-reader";
import { chapterTitle, isEdition, textbookChapters } from "@/lib/textbook";
import { getSiteSettings } from "@/lib/site-data";
import Link from "next/link";

export async function generateMetadata({ params }: { params: Promise<{ edition: string; slug: string }> }) {
  const { edition, slug } = await params;
  const chapter = textbookChapters.find((item) => item.slug === slug);
  if (!chapter || !isEdition(edition)) return {};
  return { title: `${chapterTitle(chapter, edition)} | Robotics Textbook` };
}

export default async function TextbookChapterPage({ params }: { params: Promise<{ edition: string; slug: string }> }) {
  const { edition, slug } = await params;
  const chapterIndex = textbookChapters.findIndex((item) => item.slug === slug);
  if (!isEdition(edition) || chapterIndex < 0) notFound();
  const chapter = textbookChapters[chapterIndex];
  if (chapter.status !== "published") {
    const settings = await getSiteSettings();
    return (
      <main className="site-shell textbook-placeholder-page">
        <SiteHeader active="textbook" />
        <section className="textbook-placeholder">
          <span className="section-eyebrow">CHAPTER {String(chapter.order).padStart(3, "0")}</span>
          <h1>{chapterTitle(chapter, edition)}</h1>
          <p>这一章正在按零基础教材标准整理，暂不公开阅读。完整目录已经可见，整理完成会直接替换这里。</p>
          <Link href="/textbook">← 返回教材总目录</Link>
        </section>
        <SiteFooter settings={settings} />
      </main>
    );
  }
  return (
    <main className="site-shell textbook-reader-page">
      <SiteHeader active="textbook" />
      <TextbookReader key={`${edition}-${slug}`} edition={edition} slug={slug} chapterIndex={chapterIndex} />
    </main>
  );
}
