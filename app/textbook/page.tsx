/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { SiteHeader } from "@/app/components/site-header";
import { SiteFooter } from "@/app/components/site-footer";
import {
  editions,
  groupChapters,
  publishedChapters,
  textbookChapters,
  textbookLinks,
} from "@/lib/textbook";
import { getSiteSettings } from "@/lib/site-data";

export const metadata = {
  title: "Robotics Textbook | Changyuan Xin",
  description: "A maintainable Chinese, English, and bilingual robotics textbook integrating mathematics, code, experiments, AI, and multi-robot systems.",
};

export default async function TextbookPage() {
  const settings = await getSiteSettings();
  const parts = groupChapters();
  const firstPublished = publishedChapters[0];
  return (
    <main className="site-shell textbook-landing">
      <SiteHeader active="textbook" />
      <header className="textbook-masthead">
        <div>
          <span className="section-eyebrow">OPEN ROBOTICS TEXTBOOK / 2026</span>
          <h1>机器人、人工智能与智能制造综合教材</h1>
          <p>从数学与科学编程出发，把机器人学、视觉、规划、控制、强化学习、多机协同与科研证据组织成一条可执行的学习链。</p>
          <div className="textbook-masthead-actions">
            <Link className="button-primary" href={`/textbook/zh/${firstPublished.slug}`}>进入中文阅读 <span>→</span></Link>
            <a className="textbook-source-link" href={textbookLinks.source} target="_blank" rel="noreferrer">查看可修改的 LaTeX 源仓库 ↗</a>
          </div>
        </div>
        <aside className="textbook-progress-card">
          <img src="/media/digital-twin-architecture.png" alt="Robot learning system architecture" />
          <span className="section-eyebrow">LEARNING SYSTEM</span>
          <strong>先理解，再编码，再实验</strong>
          <p>每章将直觉、公式、代码、图示与研究出口放在同一条阅读路径中。</p>
          <div className="textbook-progress-stats">
            <span><b>{publishedChapters.length}</b> 已发布章节</span>
            <span><b>{parts.length}</b> 个知识部分</span>
            <span><b>{textbookChapters.length}</b> 总目录章节</span>
          </div>
        </aside>
      </header>

      <section className="textbook-editions" aria-label="Choose an edition">
        {editions.map((edition) => (
          <article key={edition.id}>
            <span>{edition.short}</span>
            <h2>{edition.label}</h2>
            <p>{edition.id === "zh" ? "中文主线，适合完整学习与快速建立直觉。" : edition.id === "en" ? "English technical language and interview-ready explanations." : "同页对照术语与表达，适合中英并行学习。"}</p>
            <div>
              <Link href={`/textbook/${edition.id}/${firstPublished.slug}`}>开始阅读 <b>→</b></Link>
            </div>
          </article>
        ))}
      </section>

      <section className="textbook-part-index">
        <header>
          <span className="section-eyebrow">COMPLETE CONTENT MAP</span>
          <h2>完整知识地图，已验收章节逐步开放</h2>
          <p>灰色标记的章节正在按零基础教材标准整理，整理完成会逐步可读，不提前公开未定稿内容。</p>
        </header>
        {parts.map((part, index) => {
          const ready = part.chapters.filter((item) => item.status === "published").length;
          const first = part.chapters.find((item) => item.status === "published") ?? part.chapters[0];
          return (
            <article key={part.id} className={ready === 0 ? "textbook-part-pending" : ""}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h3>{part.titleZh}</h3>
                <p>{part.titleEn}</p>
              </div>
              <strong>
                {ready > 0 ? `${ready} / ${part.chapters.length} 章` : `${part.chapters.length} 章 · 整理中`}
              </strong>
              <Link href={`/textbook/zh/${first.slug}`} aria-label={`Read ${part.titleZh}`}>
                →
              </Link>
            </article>
          );
        })}
      </section>
      <SiteFooter settings={settings} />
    </main>
  );
}
