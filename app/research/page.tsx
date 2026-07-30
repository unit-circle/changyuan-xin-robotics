/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { PageHero } from "@/app/components/page-hero";
import { SiteFooter } from "@/app/components/site-footer";
import { SiteHeader } from "@/app/components/site-header";
import { getContentItems, getSiteSettings } from "@/lib/site-data";

export const metadata = {
  title: "Research | Changyuan Xin",
  description:
    "Research projects in robotic manipulation, reinforcement learning, simulation, and intelligent manufacturing.",
};

function meta(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

export default async function ResearchPage() {
  const [projects, settings] = await Promise.all([
    getContentItems("project"),
    getSiteSettings(),
  ]);

  return (
    <main className="site-shell">
      <SiteHeader active="research" />
      <PageHero
        eyebrow="RESEARCH PORTFOLIO / 01"
        title="Systems that connect"
        accent="perception, motion and making."
        description="My work grows from a practical question: how can robots understand constrained physical tasks, coordinate safely, and contribute to intelligent manufacturing?"
        image="/media/robot-factory.jpg"
        index="R / 01"
        actions={[
          { label: "Explore projects", href: "#project-index" },
          { label: "View research outputs", href: "/publications" },
        ]}
      />

      <section className="research-manifesto">
        <div>
          <span className="section-eyebrow">RESEARCH POSITION</span>
          <h2>Engineering rigor with room for <em>intelligent behavior</em>.</h2>
        </div>
        <p>
          I approach robotics as a connected system: mechanism, sensing,
          computation, decision-making, and manufacturing context all shape the
          final behavior. The portfolio below documents that developing
          trajectory rather than presenting isolated demos.
        </p>
      </section>

      <section className="research-index" id="project-index">
        {projects.map((project, index) => (
          <article className={`research-index-card card-${index + 1}`} key={project.slug}>
            <Link className="research-index-media" href={`/research/${project.slug}`}>
              <img src={project.heroImage} alt="" />
              <span>{String(index + 1).padStart(2, "0")}</span>
            </Link>
            <div className="research-index-copy">
              <div className="research-index-meta">
                <span>{meta(project.metadata.label, "Research Project")}</span>
                <small>{meta(project.metadata.period, "Ongoing")}</small>
              </div>
              <h2>
                <Link href={`/research/${project.slug}`}>{project.title}</Link>
              </h2>
              <p>{project.summary}</p>
              <div className="tag-list">
                {project.tags.map((tag) => <span key={tag}>{tag}</span>)}
              </div>
              <Link className="text-link" href={`/research/${project.slug}`}>
                Open project dossier <span>→</span>
              </Link>
            </div>
          </article>
        ))}
      </section>

      <section className="research-method-band">
        <figure>
          <img src="/media/aircraft-engine.jpg" alt="Aircraft engine engineering context" />
        </figure>
        <div>
          <span className="section-eyebrow">WORKING METHOD</span>
          <h2>Problem → Model → Experiment → Evidence</h2>
          <div className="method-steps">
            {[
              ["01", "Frame", "Turn an engineering need into a precise research question."],
              ["02", "Model", "Make geometry, motion, uncertainty, and constraints explicit."],
              ["03", "Test", "Design reproducible simulations and comparisons."],
              ["04", "Explain", "Connect results to decisions, limitations, and next work."],
            ].map(([number, title, detail]) => (
              <div key={number}>
                <span>{number}</span>
                <strong>{title}</strong>
                <p>{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter settings={settings} />
    </main>
  );
}
