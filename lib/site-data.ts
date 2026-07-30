import { env } from "cloudflare:workers";
import {
  coursework as seedCoursework,
  experiences as seedExperiences,
  outputs as seedOutputs,
  profile as seedProfile,
  projects as seedProjects,
  researchInterests as seedResearchInterests,
  resources as seedResources,
  skills as seedSkills,
} from "@/app/content";

type SiteEnv = {
  DB?: D1Database;
  UPLOADS?: R2Bucket;
  ADMIN_EMAILS?: string;
};

export type ContentType = "project" | "coursework" | "publication";

export type ContentItem = {
  id: number;
  type: ContentType;
  slug: string;
  title: string;
  subtitle: string;
  summary: string;
  body: Record<string, unknown>;
  metadata: Record<string, unknown>;
  heroImage: string;
  gallery: string[];
  tags: string[];
  featured: boolean;
  published: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type SiteSettings = {
  profile: typeof seedProfile;
  researchInterests: typeof seedResearchInterests;
  experiences: typeof seedExperiences;
  resources: typeof seedResources;
  skills: typeof seedSkills;
};

const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS site_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL DEFAULT '{}',
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS content_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    slug TEXT NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT NOT NULL DEFAULT '',
    summary TEXT NOT NULL DEFAULT '',
    body TEXT NOT NULL DEFAULT '{}',
    metadata TEXT NOT NULL DEFAULT '{}',
    hero_image TEXT NOT NULL DEFAULT '',
    gallery TEXT NOT NULL DEFAULT '[]',
    tags TEXT NOT NULL DEFAULT '[]',
    featured INTEGER NOT NULL DEFAULT 0,
    published INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(type, slug)
  )`,
  `CREATE INDEX IF NOT EXISTS content_items_type_order_idx
    ON content_items(type, published, sort_order)`,
  `CREATE TABLE IF NOT EXISTS files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    content_type TEXT NOT NULL,
    size INTEGER NOT NULL,
    visibility TEXT NOT NULL DEFAULT 'public',
    required_scope TEXT NOT NULL DEFAULT 'private_basic',
    category TEXT NOT NULL DEFAULT 'general',
    title TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS access_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    label TEXT NOT NULL,
    code_hash TEXT NOT NULL UNIQUE,
    scope TEXT NOT NULL DEFAULT 'private_basic',
    expires_at TEXT,
    max_uses INTEGER,
    use_count INTEGER NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS access_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    access_code_id INTEGER REFERENCES access_codes(id),
    action TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
] as const;

let initialized = false;

function bindings(): SiteEnv {
  return env as unknown as SiteEnv;
}

export function getD1(): D1Database {
  const database = bindings().DB;
  if (!database) throw new Error("D1 binding DB is unavailable");
  return database;
}

export function getUploadsBucket(): R2Bucket {
  const bucket = bindings().UPLOADS;
  if (!bucket) throw new Error("R2 binding UPLOADS is unavailable");
  return bucket;
}

export async function ensureDatabase(): Promise<D1Database> {
  const database = getD1();
  if (!initialized) {
    await database.batch(
      schemaStatements.map((statement) => database.prepare(statement)),
    );
    const fileColumns = await database
      .prepare("PRAGMA table_info(files)")
      .all<{ name: string }>();
    if (
      !fileColumns.results.some(
        (column: { name: string }) => column.name === "required_scope",
      )
    ) {
      await database
        .prepare(
          "ALTER TABLE files ADD COLUMN required_scope TEXT NOT NULL DEFAULT 'private_basic'",
        )
        .run();
    }
    initialized = true;
  }

  const row = await database
    .prepare("SELECT COUNT(*) AS count FROM content_items")
    .first<{ count: number }>();
  if (!row || Number(row.count) === 0) {
    await seedDatabase(database);
  }
  return database;
}

async function seedDatabase(database: D1Database): Promise<void> {
  const settings: SiteSettings = {
    profile: seedProfile,
    researchInterests: seedResearchInterests,
    experiences: seedExperiences,
    resources: seedResources,
    skills: seedSkills,
  };

  const queries = [
    database
      .prepare(
        `INSERT OR IGNORE INTO site_settings (key, value)
         VALUES ('site', ?)`,
      )
      .bind(JSON.stringify(settings)),
    ...seedProjects.map((project, index) =>
      database
        .prepare(
          `INSERT OR IGNORE INTO content_items
          (type, slug, title, subtitle, summary, body, metadata, hero_image,
           gallery, tags, featured, published, sort_order)
          VALUES ('project', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
        )
        .bind(
          project.slug,
          project.title,
          project.shortTitle,
          project.description,
          JSON.stringify({
            challenge: project.challenge,
            approach: project.approach,
            contributions: project.contributions,
            outcomes: project.outcomes,
          }),
          JSON.stringify({
            label: project.label,
            period: project.period,
            role: project.role,
            status: project.status,
          }),
          project.coverImage,
          JSON.stringify([project.heroImage, ...project.gallery]),
          JSON.stringify(project.tags),
          index < 2 ? 1 : 0,
          index,
        ),
    ),
    ...seedCoursework.map((course, index) =>
      database
        .prepare(
          `INSERT OR IGNORE INTO content_items
          (type, slug, title, subtitle, summary, body, metadata, hero_image,
           gallery, tags, featured, published, sort_order)
          VALUES ('coursework', ?, ?, '', ?, ?, ?, ?, '[]', ?, 0, 1, ?)`,
        )
        .bind(
          course.slug,
          course.title,
          course.description,
          JSON.stringify({
            items: course.items,
            skills: course.skills,
            evidence: course.evidence,
          }),
          JSON.stringify({ tone: course.tone }),
          course.image,
          JSON.stringify(course.skills),
          index,
        ),
    ),
    ...seedOutputs.map((output, index) =>
      database
        .prepare(
          `INSERT OR IGNORE INTO content_items
          (type, slug, title, subtitle, summary, body, metadata, hero_image,
           gallery, tags, featured, published, sort_order)
          VALUES ('publication', ?, ?, '', ?, ?, ?, ?, '[]', '[]', 0, 1, ?)`,
        )
        .bind(
          output.slug,
          output.title,
          output.summary,
          JSON.stringify({}),
          JSON.stringify({
            meta: output.meta,
            status: output.status,
            format: output.format,
          }),
          output.image,
          index,
        ),
    ),
  ];

  await database.batch(queries);
}

function safeJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string") return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function normalizeItem(row: Record<string, unknown>): ContentItem {
  return {
    id: Number(row.id),
    type: String(row.type) as ContentType,
    slug: String(row.slug),
    title: String(row.title),
    subtitle: String(row.subtitle ?? ""),
    summary: String(row.summary ?? ""),
    body: safeJson(String(row.body ?? "{}"), {}),
    metadata: safeJson(String(row.metadata ?? "{}"), {}),
    heroImage: String(row.hero_image ?? ""),
    gallery: safeJson(String(row.gallery ?? "[]"), []),
    tags: safeJson(String(row.tags ?? "[]"), []),
    featured: Boolean(row.featured),
    published: Boolean(row.published),
    sortOrder: Number(row.sort_order ?? 0),
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
  };
}

function seedItems(type: ContentType): ContentItem[] {
  if (type === "project") {
    return seedProjects.map((project, index) => ({
      id: index + 1,
      type,
      slug: project.slug,
      title: project.title,
      subtitle: project.shortTitle,
      summary: project.description,
      body: {
        challenge: project.challenge,
        approach: project.approach,
        contributions: project.contributions,
        outcomes: project.outcomes,
      },
      metadata: {
        label: project.label,
        period: project.period,
        role: project.role,
        status: project.status,
      },
      heroImage: project.coverImage,
      gallery: [project.heroImage, ...project.gallery],
      tags: project.tags,
      featured: index < 2,
      published: true,
      sortOrder: index,
      createdAt: "",
      updatedAt: "",
    }));
  }

  if (type === "coursework") {
    return seedCoursework.map((course, index) => ({
      id: index + 1,
      type,
      slug: course.slug,
      title: course.title,
      subtitle: "",
      summary: course.description,
      body: {
        items: course.items,
        skills: course.skills,
        evidence: course.evidence,
      },
      metadata: { tone: course.tone },
      heroImage: course.image,
      gallery: [],
      tags: course.skills,
      featured: false,
      published: true,
      sortOrder: index,
      createdAt: "",
      updatedAt: "",
    }));
  }

  return seedOutputs.map((output, index) => ({
    id: index + 1,
    type,
    slug: output.slug,
    title: output.title,
    subtitle: "",
    summary: output.summary,
    body: {},
    metadata: {
      meta: output.meta,
      status: output.status,
      format: output.format,
    },
    heroImage: output.image,
    gallery: [],
    tags: [],
    featured: false,
    published: true,
    sortOrder: index,
    createdAt: "",
    updatedAt: "",
  }));
}

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const database = await ensureDatabase();
    const row = await database
      .prepare("SELECT value FROM site_settings WHERE key = 'site'")
      .first<{ value: string }>();
    if (row?.value) {
      return safeJson(row.value, {
        profile: seedProfile,
        researchInterests: seedResearchInterests,
        experiences: seedExperiences,
        resources: seedResources,
        skills: seedSkills,
      });
    }
  } catch {
    // Static seed data keeps builds and local previews available without bindings.
  }

  return {
    profile: seedProfile,
    researchInterests: seedResearchInterests,
    experiences: seedExperiences,
    resources: seedResources,
    skills: seedSkills,
  };
}

export async function getContentItems(
  type: ContentType,
  includeDrafts = false,
): Promise<ContentItem[]> {
  try {
    const database = await ensureDatabase();
    const result = await database
      .prepare(
        `SELECT * FROM content_items
         WHERE type = ? ${includeDrafts ? "" : "AND published = 1"}
         ORDER BY sort_order ASC, id ASC`,
      )
      .bind(type)
      .all<Record<string, unknown>>();
    return result.results.map(normalizeItem);
  } catch {
    return seedItems(type);
  }
}

export async function getContentItem(
  type: ContentType,
  slug: string,
  includeDrafts = false,
): Promise<ContentItem | null> {
  try {
    const database = await ensureDatabase();
    const row = await database
      .prepare(
        `SELECT * FROM content_items
         WHERE type = ? AND slug = ?
         ${includeDrafts ? "" : "AND published = 1"}
         LIMIT 1`,
      )
      .bind(type, slug)
      .first<Record<string, unknown>>();
    return row ? normalizeItem(row) : null;
  } catch {
    return seedItems(type).find((item) => item.slug === slug) ?? null;
  }
}

export function getAdminEmails(): string[] {
  return (bindings().ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}
