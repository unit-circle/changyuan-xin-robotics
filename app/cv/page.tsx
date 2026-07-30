/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { SiteFooter } from "@/app/components/site-footer";
import { SiteHeader } from "@/app/components/site-header";
import { getContentItems, getSiteSettings } from "@/lib/site-data";

export const metadata = {
  title: "Interactive CV | Changyuan Xin",
  description:
    "Interactive academic CV linking education, research experience, engineering practice, projects, coursework, and technical methods.",
};

const experienceImages = [
  "/media/warehouse-logistics.jpg",
  "/media/exoskeleton-field.jpg",
  "/media/aircraft-engine.jpg",
];

function list(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

export default async function CvPage() {
  const [settings, projects, courses] = await Promise.all([
    getSiteSettings(),
    getContentItems("project"),
    getContentItems("coursework"),
  ]);
  const { profile, experiences, skills } = settings;

  const methodSkills = skills.filter((skill) =>
    /learning|vision|planning/i.test(skill),
  );
  const engineeringSkills = skills.filter((skill) =>
    /design|engineering|simulation/i.test(skill),
  );
  const practiceSkills = skills.filter(
    (skill) =>
      !methodSkills.includes(skill) && !engineeringSkills.includes(skill),
  );

  return (
    <main className="site-shell cv2-page">
      <SiteHeader active="cv" />

      <section className="cv2-hero">
        <div className="cv2-hero-copy">
          <span className="section-eyebrow">INTERACTIVE ACADEMIC CV / 2026</span>
          <p className="cv2-chinese-name">{profile.chineseName} · CHANGYUAN XIN</p>
          <h1>
            Engineering foundations.
            <em>Research momentum.</em>
          </h1>
          <p className="cv2-lead">
            {profile.bio}
          </p>
          <div className="page-actions">
            <a className="button-primary" href="#experience">
              Explore the record <span>↓</span>
            </a>
            <a className="button-secondary" href={`mailto:${profile.email}`}>
              Contact me
            </a>
          </div>
          <div className="cv2-link-row">
            <a href={profile.github}>GitHub ↗</a>
            <a href={profile.scholar}>Google Scholar ↗</a>
            <a href={profile.orcid}>ORCID ↗</a>
            <span>PDF CV · ready for upload</span>
          </div>
        </div>

        <figure className="cv2-hero-visual">
          <img
            alt="Engineering research environment"
            src={profile.portrait || "/media/robot-factory.jpg"}
          />
          <div className="cv2-identity-card">
            <span>CURRENT POSITION</span>
            <strong>{profile.role}</strong>
            <small>{profile.university}</small>
          </div>
          <figcaption>
            <span>FOCUS</span>
            Robotic manipulation · learning · intelligent manufacturing
          </figcaption>
        </figure>
      </section>

      <section className="cv2-fact-band" aria-label="Academic overview">
        {[
          ["01", "Education", profile.degree],
          ["02", "Institution", profile.university],
          ["03", "Research field", "Robotics & Intelligent Manufacturing"],
          ["04", "Status", profile.availability],
        ].map(([number, label, value]) => (
          <article key={label}>
            <span>{number}</span>
            <small>{label}</small>
            <strong>{value}</strong>
          </article>
        ))}
      </section>

      <section className="cv2-section cv2-experience" id="experience">
        <header className="cv2-section-heading">
          <div>
            <span className="section-eyebrow">RESEARCH & ENGINEERING / 01</span>
            <h2>
              A trajectory built through
              <em>progressive responsibility.</em>
            </h2>
          </div>
          <p>
            Research, innovation, and industrial practice are presented as one
            connected progression rather than isolated resume entries.
          </p>
        </header>

        <div className="cv2-experience-list">
          {experiences.map((experience, index) => (
            <article key={experience.title}>
              <div className="cv2-experience-index">
                <span>0{index + 1}</span>
                <small>{experience.period}</small>
              </div>
              <div className="cv2-experience-copy">
                <span>{experience.place}</span>
                <h3>{experience.title}</h3>
                <p>
                  {index === 0
                    ? "Research exposure connecting industrial connectivity, intelligent decision systems, and engineering-oriented investigation."
                    : index === 1
                      ? "Core project work spanning mechanical structure, motion-control strategy, modeling, and technical documentation."
                      : "Engineering practice in an aviation manufacturing environment, connecting academic methods with production realities."}
                </p>
                <Link href={experience.href}>
                  {experience.action} <span>↗</span>
                </Link>
              </div>
              <figure>
                <img alt="" src={experienceImages[index] ?? experienceImages[0]} />
              </figure>
            </article>
          ))}
        </div>
      </section>

      <section className="cv2-section cv2-projects" id="projects">
        <header className="cv2-section-heading">
          <div>
            <span className="section-eyebrow">SELECTED EVIDENCE / 02</span>
            <h2>
              Research claims linked to
              <em>project evidence.</em>
            </h2>
          </div>
          <Link href="/research">Open research directory ↗</Link>
        </header>

        <div className="cv2-project-grid">
          {projects.map((project, index) => (
            <Link href={`/research/${project.slug}`} key={project.slug}>
              <figure>
                <img alt="" src={project.heroImage} />
                <span>0{index + 1}</span>
              </figure>
              <div>
                <small>
                  {String(project.metadata.label ?? "Research project")}
                </small>
                <h3>{project.title}</h3>
                <p>{project.summary}</p>
                <div className="tag-list">
                  {project.tags.slice(0, 3).map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="cv2-foundation" id="education">
        <div className="cv2-education-panel">
          <span className="section-eyebrow">EDUCATION / 03</span>
          <h2>{profile.university}</h2>
          <strong>{profile.degree}</strong>
          <p>{profile.school} · {profile.location}</p>
          <blockquote>
            “The value of an interdisciplinary education is the ability to move
            between mechanism, control, computation, and system decisions.”
          </blockquote>
          <Link href="/coursework">Explore coursework evidence ↗</Link>
        </div>

        <div className="cv2-course-map" id="courses">
          <span className="section-eyebrow">ACADEMIC FOUNDATION</span>
          <h2>Coursework connected to capability</h2>
          <div>
            {courses.map((course, index) => (
              <Link href={`/coursework/${course.slug}`} key={course.slug}>
                <span>0{index + 1}</span>
                <strong>{course.title}</strong>
                <small>{list(course.body.items).slice(0, 2).join(" · ")}</small>
                <i>↗</i>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="cv2-section cv2-skills" id="skills">
        <header className="cv2-section-heading">
          <div>
            <span className="section-eyebrow">METHODS & TOOLS / 04</span>
            <h2>
              Skills organized by
              <em>how they support research.</em>
            </h2>
          </div>
        </header>
        <div className="cv2-skill-grid">
          {[
            ["Research methods", methodSkills, "METHOD"],
            ["Engineering systems", engineeringSkills, "SYSTEM"],
            ["Implementation & communication", practiceSkills, "PRACTICE"],
          ].map(([title, items, label], index) => (
            <article key={String(title)}>
              <span>{String(index + 1).padStart(2, "0")} / {String(label)}</span>
              <h3>{String(title)}</h3>
              <div>
                {(items as string[]).map((skill) => (
                  <p key={skill}><i />{skill}</p>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="cv2-contact">
        <div>
          <span className="section-eyebrow">NEXT CONVERSATION</span>
          <h2>
            Interested in the research?
            <em>Follow the evidence or get in touch.</em>
          </h2>
        </div>
        <div>
          <a className="button-primary" href={`mailto:${profile.email}`}>
            Email {profile.name} <span>↗</span>
          </a>
          <Link className="button-secondary" href="/private">
            Private materials
          </Link>
        </div>
      </section>

      <SiteFooter settings={settings} />
    </main>
  );
}
