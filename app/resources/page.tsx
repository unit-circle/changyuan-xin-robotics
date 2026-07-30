/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { PageHero } from "@/app/components/page-hero";
import { SiteFooter } from "@/app/components/site-footer";
import { SiteHeader } from "@/app/components/site-header";
import { getContentItems, getSiteSettings } from "@/lib/site-data";

export const metadata = {
  title: "Resources | Changyuan Xin",
  description:
    "Public code, simulations, technical reports, coursework evidence, and academic materials.",
};

export default async function ResourcesPage() {
  const [settings, projects, courses, outputs] = await Promise.all([
    getSiteSettings(),
    getContentItems("project"),
    getContentItems("coursework"),
    getContentItems("publication"),
  ]);

  return (
    <main className="site-shell">
      <SiteHeader active="resources" />
      <PageHero
        eyebrow="PUBLIC RESOURCES / 04"
        title="Materials designed to be"
        accent="read, tested and reused."
        description="Public reports, project records, coursework evidence, code, and simulation materials will be organized here as the portfolio develops."
        image="/media/warehouse-robot.jpg"
        index="D / 04"
        actions={[
          { label: "Browse collections", href: "#collections" },
          { label: "Private materials", href: "/private" },
        ]}
      />

      <section className="resource-collections" id="collections">
        <article id="code" className="resource-collection featured">
          <figure><img src="/media/programming-code.jpg" alt="" /></figure>
          <div>
            <span className="section-eyebrow">CODE & SIMULATION</span>
            <h2>Reproducible engineering workflows</h2>
            <p>
              Simulation scenes, experiment configurations, utilities, and
              documented code repositories will be attached to their related
              research projects.
            </p>
            <div className="resource-link-list">
              {projects.slice(0, 3).map((project) => (
                <Link href={`/research/${project.slug}`} key={project.slug}>
                  {project.subtitle || project.title}<span>↗</span>
                </Link>
              ))}
            </div>
          </div>
        </article>

        <article id="reports" className="resource-collection">
          <figure><img src="/media/design-prototype.jpg" alt="" /></figure>
          <div>
            <span className="section-eyebrow">TECHNICAL REPORTS</span>
            <h2>Reports and research records</h2>
            <div className="resource-link-list">
              {outputs.map((output) => (
                <Link href={`/publications#${output.slug}`} key={output.slug}>
                  {output.title}<span>↗</span>
                </Link>
              ))}
            </div>
          </div>
        </article>

        <article className="resource-collection">
          <figure><img src="/media/mechanical-engineering.jpg" alt="" /></figure>
          <div>
            <span className="section-eyebrow">COURSE EVIDENCE</span>
            <h2>Engineering coursework portfolio</h2>
            <div className="resource-link-list">
              {courses.map((course) => (
                <Link href={`/coursework/${course.slug}`} key={course.slug}>
                  {course.title}<span>↗</span>
                </Link>
              ))}
            </div>
          </div>
        </article>
      </section>

      <section className="resource-policy">
        <span className="resource-policy-index">ACCESS / 01</span>
        <div>
          <span className="section-eyebrow">CLEAR ACCESS BOUNDARIES</span>
          <h2>Public evidence stays public. Sensitive material stays controlled.</h2>
          <p>
            Public files can be downloaded directly. Transcripts, unpublished
            manuscripts, proposals, and application-specific documents remain
            behind authorization codes.
          </p>
        </div>
        <Link href="/private">Private Materials ↗</Link>
      </section>

      <SiteFooter settings={settings} />
    </main>
  );
}
