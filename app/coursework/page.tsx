/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { PageHero } from "@/app/components/page-hero";
import { SiteFooter } from "@/app/components/site-footer";
import { SiteHeader } from "@/app/components/site-header";
import { getContentItems, getSiteSettings } from "@/lib/site-data";

export const metadata = {
  title: "Coursework | Changyuan Xin",
  description:
    "Selected robotics, AI, mechanical engineering, industrial engineering, and programming coursework presented as technical evidence.",
};

function list(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

export default async function CourseworkPage() {
  const [courses, settings] = await Promise.all([
    getContentItems("coursework"),
    getSiteSettings(),
  ]);

  return (
    <main className="site-shell">
      <SiteHeader active="coursework" />
      <PageHero
        eyebrow="ENGINEERING & COURSEWORK / 02"
        title="Coursework as"
        accent="evidence, not a transcript."
        description="Selected courses are organized around the abilities they developed: modeling, experimentation, design, computation, and systems thinking."
        image="/media/mechanical-engineering.jpg"
        index="C / 02"
        actions={[
          { label: "Browse capability areas", href: "#course-index" },
          { label: "Interactive CV", href: "/cv" },
        ]}
      />

      <section className="course-intro-band">
        <span>MECHANICS</span><i>+</i>
        <span>CONTROL</span><i>+</i>
        <span>COMPUTATION</span><i>+</i>
        <span>DECISION</span>
      </section>

      <section className="course-directory" id="course-index">
        {courses.map((course, index) => (
          <article className={`course-directory-card course-${index + 1}`} key={course.slug}>
            <figure className={course.heroImage.endsWith(".svg") ? "course-diagram" : ""}>
              <img src={course.heroImage} alt="" />
              <figcaption>0{index + 1}</figcaption>
            </figure>
            <div>
              <span className="section-eyebrow">CAPABILITY AREA</span>
              <h2>{course.title}</h2>
              <p>{course.summary}</p>
              <ul>
                {list(course.body.items).map((item) => <li key={item}>{item}</li>)}
              </ul>
              <Link className="text-link" href={`/coursework/${course.slug}`}>
                View course evidence <span>→</span>
              </Link>
            </div>
          </article>
        ))}
      </section>

      <section className="course-closing">
        <figure><img src="/media/engineering-lab.jpg" alt="" /></figure>
        <div>
          <span className="section-eyebrow">LEARNING PHILOSOPHY</span>
          <h2>Knowledge becomes valuable when it can be <em>used, tested, and explained</em>.</h2>
          <p>
            The final portfolio will connect each course to reports, code,
            models, drawings, and reflections. These materials can be replaced
            or expanded later from the administration workspace.
          </p>
        </div>
      </section>

      <SiteFooter settings={settings} />
    </main>
  );
}
