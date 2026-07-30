/* eslint-disable @next/next/no-img-element */

import { SiteFooter } from "./components/site-footer";
import { SiteHeader } from "./components/site-header";
import { getContentItems, getSiteSettings } from "@/lib/site-data";

function stringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

function SectionTitle({
  eyebrow,
  children,
  link,
}: {
  eyebrow: string;
  children: React.ReactNode;
  link?: string;
}) {
  return (
    <div className="section-title-row">
      <div>
        <span className="section-eyebrow">{eyebrow}</span>
        <h2>{children}</h2>
      </div>
      {link && <a href={link}>Explore all <span aria-hidden="true">→</span></a>}
    </div>
  );
}

export default async function Home() {
  const [settings, projects, outputs, coursework] = await Promise.all([
    getSiteSettings(),
    getContentItems("project"),
    getContentItems("publication"),
    getContentItems("coursework"),
  ]);
  const { profile, researchInterests, experiences, resources } = settings;

  return (
    <main className="site-shell" id="top">
      <SiteHeader active="home" />

      <section className="hero-panel">
        <div className="hero-visual">
          <div className="hero-photo" role="img" aria-label="Industrial robotic assembly research" />
          <div className="photo-reserve">
            <span>PORTRAIT AREA</span>
            <strong>Your photograph will live here</strong>
          </div>
          <blockquote>
            <span className="quote-mark">“</span>
            <p>{profile.quote}</p>
            <cite>{profile.chineseName}</cite>
          </blockquote>
        </div>

        <div className="hero-profile">
          <span className="hero-kicker">{profile.chineseName} · {profile.name}</span>
          <h1 aria-label="Creative Robotics Researcher">
            Creative <em>Robotics</em>
            <span>Researcher</span>
          </h1>
          <p className="focus-line">
            Robotic Manipulation <i>•</i> Computer Vision <i>•</i>
            {" "}Reinforcement Learning <i>•</i> Intelligent Manufacturing
          </p>

          <div className="hero-details">
            <div className="profile-facts">
              <p><strong>University</strong><span>{profile.university}</span></p>
              <p><strong>Degree</strong><span>{profile.degree}</span></p>
              <p><strong>Research</strong><span>{profile.focus}</span></p>
              <p><strong>Location</strong><span>{profile.location}</span></p>
              <p><strong>Availability</strong><span>{profile.availability}</span></p>
            </div>
            <aside className="hero-links" aria-label="Quick links">
              <a href="#interactive-cv"><span>01</span>Interactive CV</a>
              <a href="#projects"><span>02</span>Research Projects</a>
              <a href="#publications"><span>03</span>Research Outputs</a>
              <a href="#coursework"><span>04</span>Coursework</a>
            </aside>
          </div>

          <div className="stat-strip" aria-label="Portfolio statistics">
            <div><b>02</b><span>Featured Projects</span></div>
            <div><b>01</b><span>Research Institute</span></div>
            <div><b>20+</b><span>Core Courses</span></div>
            <div><b>05</b><span>Research Directions</span></div>
          </div>
        </div>
      </section>

      <section className="intro-section" id="research">
        <div className="about-panel">
          <div className="science-orb" role="img" aria-label="Luminous research network visualization" />
          <div>
            <span className="section-eyebrow">ABOUT / 01</span>
            <h2>Building intelligence that can <em>move</em>.</h2>
            <p>{profile.bio}</p>
            <a className="text-link" href="#interactive-cv">Read the interactive CV <span>→</span></a>
          </div>
        </div>

        <div className="interests-panel">
          <span className="section-eyebrow">RESEARCH INTERESTS / 02</span>
          <div className="interest-grid">
            {researchInterests.map((interest, index) => (
              <a href="#projects" className={`interest-item ${interest.tone}`} key={interest.title}>
                <span className="interest-index">0{index + 1}</span>
                <strong>{interest.title}</strong>
                <small>{interest.detail}</small>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="content-section projects-section" id="projects">
        <SectionTitle eyebrow="SELECTED WORK / 03" link="#projects">
          Research projects with <em>real engineering context</em>
        </SectionTitle>
        <div className="project-grid">
          {projects.map((project, index) => (
            <article className="project-card" key={project.title}>
              <figure className="project-art">
                <img
                  src={project.heroImage}
                  alt={`${project.title} project illustration`}
                />
                <span>{String(index + 1).padStart(2, "0")}</span>
              </figure>
              <div className="project-copy">
                <span className="project-label">
                  {stringValue(project.metadata.label, "Research Project")}
                </span>
                <h3>{project.title}</h3>
                <p>{project.summary}</p>
                <div className="project-footer">
                  <div className="tag-list">
                    {project.tags.map((tag) => <span key={tag}>{tag}</span>)}
                  </div>
                  <a href={`/research/${project.slug}`} aria-label={`Read more about ${project.title}`}>↗</a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="content-section outputs-section" id="publications">
        <SectionTitle eyebrow="PUBLICATIONS & OUTPUTS / 04" link="#publications">
          Research records, reports and reproducible work
        </SectionTitle>
        <div className="output-grid">
          {outputs.map((output) => (
            <article key={output.title}>
              <figure className="output-cover">
                <img src={output.heroImage} alt="" />
                <figcaption>RESEARCH OUTPUT</figcaption>
              </figure>
              <div className="output-copy">
                <span className="output-status">
                  {stringValue(output.metadata.status, "Research output")}
                </span>
                <h3>{output.title}</h3>
                <p>{stringValue(output.metadata.meta, output.summary)}</p>
                <a href={`/publications#${output.slug}`}>View record <span>→</span></a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="content-section course-section" id="coursework">
        <SectionTitle eyebrow="ENGINEERING FOUNDATION / 05">
          Coursework presented as <em>evidence of capability</em>
        </SectionTitle>
        <div className="course-grid">
          {coursework.map((group, index) => (
            <article
              className={`course-card ${stringValue(group.metadata.tone, "blue")}`}
              key={group.title}
            >
              <figure className="course-image">
                <img src={group.heroImage} alt={`${group.title} visual`} />
              </figure>
              <div className="course-copy">
                <span className="course-number">0{index + 1}</span>
                <h3>{group.title}</h3>
                <ul>
                  {stringList(group.body.items).map((item) => <li key={item}>{item}</li>)}
                </ul>
                <a href={`/coursework/${group.slug}`}>Explore coursework <span>→</span></a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="content-section cv-section" id="interactive-cv">
        <SectionTitle eyebrow="INTERACTIVE CV / 06">
          A connected academic <em>trajectory</em>
        </SectionTitle>
        <div className="cv-layout">
          <div className="cv-visual">
            <img
              src="/og-v2.png"
              alt="Robotics and intelligent manufacturing research montage"
            />
            <div className="cv-visual-copy">
              <span>INDUSTRIAL ENGINEERING</span>
              <strong>From mechanical foundations to embodied intelligence.</strong>
              <p>Design · Control · Perception · Learning · Collaboration</p>
            </div>
          </div>
          <div className="experience-list">
            {experiences.map((experience, index) => (
              <article key={experience.title}>
                <span className="experience-index">0{index + 1}</span>
                <div>
                  <small>{experience.period}</small>
                  <h3>{experience.title}</h3>
                  <p>{experience.place}</p>
                </div>
                <a href={experience.href}>View <span>↗</span></a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="content-section resources-section" id="resources">
        <SectionTitle eyebrow="RESOURCES / 07">
          Open materials and selected evidence
        </SectionTitle>
        <div className="resource-grid">
          {resources.map((resource, index) => (
            <a className="resource-card" href={resource.href} key={resource.title}>
              <img src={resource.image} alt="" />
              <span className="resource-number">0{index + 1}</span>
              <div><strong>{resource.title}</strong><small>{resource.detail}</small></div>
              <i>↗</i>
            </a>
          ))}
        </div>
      </section>

      <SiteFooter settings={settings} />
    </main>
  );
}
