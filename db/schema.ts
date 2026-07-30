import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const siteSettings = sqliteTable(
  "site_settings",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    key: text("key").notNull(),
    value: text("value").notNull().default("{}"),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [uniqueIndex("site_settings_key_idx").on(table.key)],
);

export const contentItems = sqliteTable(
  "content_items",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    type: text("type").notNull(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    subtitle: text("subtitle").notNull().default(""),
    summary: text("summary").notNull().default(""),
    body: text("body").notNull().default("{}"),
    metadata: text("metadata").notNull().default("{}"),
    heroImage: text("hero_image").notNull().default(""),
    gallery: text("gallery").notNull().default("[]"),
    tags: text("tags").notNull().default("[]"),
    featured: integer("featured", { mode: "boolean" }).notNull().default(false),
    published: integer("published", { mode: "boolean" }).notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("content_items_type_slug_idx").on(table.type, table.slug),
  ],
);

export const files = sqliteTable("files", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  contentType: text("content_type").notNull(),
  size: integer("size").notNull(),
  visibility: text("visibility").notNull().default("public"),
  requiredScope: text("required_scope").notNull().default("private_basic"),
  category: text("category").notNull().default("general"),
  title: text("title").notNull().default(""),
  description: text("description").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const accessCodes = sqliteTable("access_codes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  label: text("label").notNull(),
  codeHash: text("code_hash").notNull().unique(),
  scope: text("scope").notNull().default("private_basic"),
  expiresAt: text("expires_at"),
  maxUses: integer("max_uses"),
  useCount: integer("use_count").notNull().default(0),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const accessLogs = sqliteTable("access_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accessCodeId: integer("access_code_id").references(() => accessCodes.id),
  action: text("action").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
