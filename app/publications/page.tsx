/* eslint-disable @next/next/no-img-element */

import { PageHero } from "@/app/components/page-hero";
import { SiteFooter } from "@/app/components/site-footer";
import { SiteHeader } from "@/app/components/site-header";
import { getContentItems, getSiteSettings } from "@/lib/site-data";

export const metadata = {
  title: "Research Outputs | Changyuan Xin",
  description:
    "Research records, technical reports, simulation notes, and selected engineering portfolio outputs.",
};

function meta(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

export default async function PublicationsPage() {
  const [outputs, settings] = await Promise.all([
    getContentItems("publication"),
    getSiteSettings(),
  ]);

  return (
    <main className="site-shell">
      <SiteHeader active="publications" />
      <PageHero
        eyebrow="PUBLICATIONS & OUTPUTS / 03"
        title="Research should leave"
        accent="a clear record."
        description="This section brings together ongoing studies, technical reports, simulation notebooks, and selected engineering evidence. Formal publications can be added through the content manager."
        image="/media/programming-workstation.jpg"
        index="P / 03"
        actions={[{ label: "Browse outputs", href: "#output-list" }]}
      />

      <section className="publication-list" id="output-list">
        {outputs.map((output, index) => (
          <article id={output.slug} key={output.slug}>
            <figure><img src={output.heroImage} alt="" /></figure>
            <span className="publication-number">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className="publication-copy">
              <div>
                <span className="output-status">
                  {meta(output.metadata.status, "Research output")}
                </span>
                <small>{meta(output.metadata.format, "Portfolio record")}</small>
              </div>
              <h2>{output.title}</h2>
              <p>{output.summary}</p>
              <footer>
                <span>{meta(output.metadata.meta)}</span>
                <button disabled>FILES WILL APPEAR HERE</button>
              </footer>
            </div>
          </article>
        ))}
      </section>

      <section className="citation-note">
        <div>
          <span className="section-eyebrow">PUBLICATION POLICY</span>
          <h2>Accurate status, authorship, and access</h2>
        </div>
        <p>
          Drafts and unpublished work will remain clearly labeled. Public files
          will be downloadable here; restricted manuscripts and application
          materials will be served only through Private Materials.
        </p>
      </section>

      <SiteFooter settings={settings} />
    </main>
  );
}
