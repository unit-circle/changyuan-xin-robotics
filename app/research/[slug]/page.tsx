/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/app/components/site-footer";
import { SiteHeader } from "@/app/components/site-header";
import { getContentItem, getContentItems, getSiteSettings } from "@/lib/site-data";

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function list(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

export async function generateStaticParams() {
  const projects = await getContentItems("project");
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getContentItem("project", slug);
  return project
    ? {
        title: `${project.title} | Changyuan Xin`,
        description: project.summary,
      }
    : { title: "Research Project | Changyuan Xin" };
}

export default async function ResearchDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [project, settings, allProjects] = await Promise.all([
    getContentItem("project", slug),
    getSiteSettings(),
    getContentItems("project"),
  ]);
  if (!project) notFound();

  const approach = list(project.body.approach);
  const contributions = list(project.body.contributions);
  const outcomes = list(project.body.outcomes);
  const next =
    allProjects[(allProjects.findIndex((item) => item.slug === project.slug) + 1) %
      allProjects.length];

  return (
    <main className="site-shell project-detail-page">
      <SiteHeader active="research" />

      <section className="project-detail-hero">
        <div className="project-detail-intro">
          <div className="breadcrumb">
            <Link href="/research">Research</Link><span>/</span>
            <span>{text(project.metadata.label, "Project")}</span>
          </div>
          <span className="section-eyebrow">
            {text(project.metadata.status, "Research project")}
          </span>
          <h1>{project.title}</h1>
          <p>{project.summary}</p>
          <div className="tag-list">
            {project.tags.map((tag) => <span key={tag}>{tag}</span>)}
          </div>
        </div>
        <figure className="project-detail-cover">
          <img src={project.heroImage} alt="" />
          <figcaption>
            <span>PROJECT DOSSIER</span>
            <strong>{text(project.metadata.period, "Ongoing")}</strong>
          </figcaption>
        </figure>
      </section>

      <section className="project-facts">
        {[
          ["Role", text(project.metadata.role, "Researcher")],
          ["Period", text(project.metadata.period, "Ongoing")],
          ["Status", text(project.metadata.status, "In progress")],
          ["Focus", project.tags.slice(0, 2).join(" · ")],
        ].map(([label, value]) => (
          <div key={label}><span>{label}</span><strong>{value}</strong></div>
        ))}
      </section>

      <section className="project-narrative">
        <div className="project-challenge">
          <span className="section-eyebrow">THE CHALLENGE</span>
          <h2>Why this problem <em>matters</em>.</h2>
          <p>{text(project.body.challenge, project.summary)}</p>
        </div>
        <div className="project-approach">
          <span className="section-eyebrow">RESEARCH APPROACH</span>
          <ol>
            {approach.map((item, index) => (
              <li key={item}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p>{item}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="project-gallery" aria-label="Project visual gallery">
        {project.gallery.slice(0, 4).map((image, index) => (
          <figure className={`gallery-item gallery-${index + 1}`} key={image}>
            <img src={image} alt="" />
            <figcaption>{String(index + 1).padStart(2, "0")} / VISUAL RECORD</figcaption>
          </figure>
        ))}
      </section>

      <section className="project-evidence">
        <div>
          <span className="section-eyebrow">MY CONTRIBUTIONS</span>
          <h2>Work completed and capabilities demonstrated</h2>
          <ul>
            {contributions.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
        <div className="outcome-panel">
          <span className="section-eyebrow">CURRENT OUTPUTS</span>
          {outcomes.map((item, index) => (
            <p key={item}><span>0{index + 1}</span>{item}</p>
          ))}
          <small>
            Detailed reports, code, and experimental materials will be attached
            through the administration workspace as they become publishable.
          </small>
        </div>
      </section>

      {next && (
        <Link className="next-project" href={`/research/${next.slug}`}>
          <span>NEXT PROJECT</span>
          <strong>{next.title}</strong>
          <i>↗</i>
        </Link>
      )}

      <SiteFooter settings={settings} />
    </main>
  );
}
