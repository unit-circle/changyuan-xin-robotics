# XCY Robotics Academic Portfolio

Changyuan Xin's deployable academic portfolio for graduate and PhD
applications. It combines a bright technical editorial style with structured
research, coursework, interactive CV, resources, private materials, and an
administration workspace.

## Included

- Public homepage, research, coursework, publications, CV, and resources
- Individual research-project and coursework detail pages
- Responsive desktop, tablet, and mobile layouts
- D1-backed editable content with built-in initial seed data
- R2 image and document uploads
- Cloudflare Access-protected administration workspace
- Server-verified reviewer codes and protected private files
- Dynamic sitemap, robots route, metadata, Open Graph image, and favicon

## Cloudflare architecture

- Cloudflare Worker: application runtime
- Cloudflare D1 binding `DB`: content, file metadata, access codes, and logs
- Cloudflare R2 binding `UPLOADS`: images and documents
- Cloudflare Access: administrator identity protection
- Custom Domain: `https://changyuanxin.dpdns.org`

The public site remains open. Only `/admin*` and `/api/admin/*` should be
protected by Cloudflare Access. The application additionally checks the
server-side `ADMIN_EMAILS` allowlist.

## Local development on Windows

```powershell
cd "C:\Users\XIN\Documents\Codex\2026-07-29\referenced-chatgpt-conversation-this-is-untrusted\outputs\phd-academic-website"
npm run dev
```

Open `http://127.0.0.1:3000/`.

Without local D1 and R2 bindings, public pages use the initial content in
`app/content.ts`. Production content is stored in D1 and can be managed from
`/admin`.

## Verification

```powershell
npm run typecheck
npm run lint
npm test
```

## Deployment

Follow [CLOUDFLARE_DEPLOYMENT.md](./CLOUDFLARE_DEPLOYMENT.md). It covers
Cloudflare login, D1 and R2 creation, database migration, deployment, custom
domain verification, Cloudflare Access configuration, and future updates.

## Before the final public launch

- Replace the portrait placeholder with the final personal photograph.
- Confirm email, Google Scholar, GitHub, ORCID, and LinkedIn links.
- Review all resume-derived dates, descriptions, and research status.
- Upload the final PDF CV and selected public/private documents.
- Replace reference imagery with original research figures when available.

Do not commit passwords, API tokens, access codes, private documents, or
`.dev.vars`.
