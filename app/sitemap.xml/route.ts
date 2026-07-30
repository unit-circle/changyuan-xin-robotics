import { getContentItems } from "@/lib/site-data";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const [projects, courses] = await Promise.all([
    getContentItems("project"),
    getContentItems("coursework"),
  ]);
  const paths = [
    "",
    "/research",
    "/publications",
    "/coursework",
    "/cv",
    "/resources",
    ...projects.map((item) => `/research/${item.slug}`),
    ...courses.map((item) => `/coursework/${item.slug}`),
  ];
  const lastModified = new Date().toISOString();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths
  .map(
    (path) => `  <url>
    <loc>${origin}${path}</loc>
    <lastmod>${lastModified}</lastmod>
  </url>`,
  )
  .join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
