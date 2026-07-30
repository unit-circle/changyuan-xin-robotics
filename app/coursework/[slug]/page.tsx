/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/app/components/site-footer";
import { SiteHeader } from "@/app/components/site-header";
import { getContentItem, getContentItems, getSiteSettings } from "@/lib/site-data";

function list(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

export async function generateStaticParams() {
  const courses = await getContentItems("coursework");
  return courses.map((course) => ({ slug: course.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = await getContentItem("coursework", slug);
  return course
    ? {
        title: `${course.title} Coursework | Changyuan Xin`,
        description: course.summary,
      }
    : { title: "Coursework | Changyuan Xin" };
}

export default async function CourseworkDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [course, settings] = await Promise.all([
    getContentItem("coursework", slug),
    getSiteSettings(),
  ]);
  if (!course) notFound();

  const items = list(course.body.items);
  const skills = list(course.body.skills);
  const evidence = list(course.body.evidence);

  return (
    <main className="site-shell">
      <SiteHeader active="coursework" />

      <section className="course-detail-hero">
        <div>
          <div className="breadcrumb">
            <Link href="/coursework">Coursework</Link><span>/</span><span>{course.title}</span>
          </div>
          <span className="section-eyebrow">COURSE CAPABILITY DOSSIER</span>
          <h1>{course.title}</h1>
          <p>{course.summary}</p>
          <div className="tag-list">
            {skills.map((skill) => <span key={skill}>{skill}</span>)}
          </div>
        </div>
        <figure className={course.heroImage.endsWith(".svg") ? "course-diagram" : ""}>
          <img src={course.heroImage} alt="" />
        </figure>
      </section>

      <section className="course-detail-grid">
        <article className="course-study-list">
          <span className="section-eyebrow">CORE STUDY</span>
          <h2>Subjects included</h2>
          {items.map((item, index) => (
            <div key={item}><span>0{index + 1}</span><strong>{item}</strong></div>
          ))}
        </article>
        <article className="capability-map">
          <span className="section-eyebrow">CAPABILITY MAP</span>
          <h2>What this area demonstrates</h2>
          <div>
            {skills.map((skill, index) => (
              <p key={skill}><span>{String(index + 1).padStart(2, "0")}</span>{skill}</p>
            ))}
          </div>
        </article>
      </section>

      <section className="evidence-preview">
        <div>
          <span className="section-eyebrow">SELECTED EVIDENCE</span>
          <h2>Reports, models, code, and technical reflection</h2>
        </div>
        <div className="evidence-cards">
          {evidence.map((item, index) => (
            <article key={item}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{item}</h3>
              <p>
                File records and descriptions can be attached from the admin
                workspace when the final material is ready.
              </p>
              <small>COMING FROM CONTENT MANAGER</small>
            </article>
          ))}
        </div>
      </section>

      <Link className="next-project" href="/coursework">
        <span>COURSEWORK INDEX</span>
        <strong>Explore all capability areas</strong>
        <i>↗</i>
      </Link>

      <SiteFooter settings={settings} />
    </main>
  );
}
