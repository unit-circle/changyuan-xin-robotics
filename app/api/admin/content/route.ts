import { revalidatePath } from "next/cache";
import { requireAdminApi } from "@/lib/admin-auth";
import {
  ensureDatabase,
  getContentItems,
  getSiteSettings,
  type ContentType,
} from "@/lib/site-data";

const validTypes: ContentType[] = ["project", "coursework", "publication"];

function isContentType(value: unknown): value is ContentType {
  return typeof value === "string" && validTypes.includes(value as ContentType);
}

export async function GET() {
  const auth = await requireAdminApi();
  if (auth instanceof Response) return auth;

  const database = await ensureDatabase();
  const [projects, coursework, publications, settings, files, accessCodes] =
    await Promise.all([
      getContentItems("project", true),
      getContentItems("coursework", true),
      getContentItems("publication", true),
      getSiteSettings(),
      database
        .prepare("SELECT * FROM files ORDER BY created_at DESC, id DESC")
        .all<Record<string, unknown>>(),
      database
        .prepare(
          `SELECT id, label, scope, expires_at, max_uses, use_count, active, created_at
           FROM access_codes ORDER BY created_at DESC, id DESC`,
        )
        .all<Record<string, unknown>>(),
    ]);

  return Response.json({
    user: auth,
    settings,
    content: { projects, coursework, publications },
    files: files.results,
    accessCodes: accessCodes.results,
  });
}

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if (auth instanceof Response) return auth;

  const payload = (await request.json()) as Record<string, unknown>;
  const operation = String(payload.operation ?? "");
  const database = await ensureDatabase();

  if (operation === "settings") {
    const settings = payload.settings;
    if (!settings || typeof settings !== "object") {
      return Response.json({ error: "Invalid settings payload" }, { status: 400 });
    }
    await database
      .prepare(
        `INSERT INTO site_settings (key, value, updated_at)
         VALUES ('site', ?, CURRENT_TIMESTAMP)
         ON CONFLICT(key) DO UPDATE SET
           value = excluded.value,
           updated_at = CURRENT_TIMESTAMP`,
      )
      .bind(JSON.stringify(settings))
      .run();
    revalidatePath("/", "layout");
    return Response.json({ ok: true });
  }

  if (operation === "content") {
    const item = payload.item as Record<string, unknown> | undefined;
    if (!item || !isContentType(item.type)) {
      return Response.json({ error: "Invalid content type" }, { status: 400 });
    }
    const slug = String(item.slug ?? "").trim();
    const title = String(item.title ?? "").trim();
    if (!slug || !title || !/^[a-z0-9-]+$/.test(slug)) {
      return Response.json(
        { error: "Title and a lowercase URL slug are required" },
        { status: 400 },
      );
    }

    const values = [
      item.type,
      slug,
      title,
      String(item.subtitle ?? ""),
      String(item.summary ?? ""),
      JSON.stringify(item.body ?? {}),
      JSON.stringify(item.metadata ?? {}),
      String(item.heroImage ?? ""),
      JSON.stringify(item.gallery ?? []),
      JSON.stringify(item.tags ?? []),
      item.featured ? 1 : 0,
      item.published === false ? 0 : 1,
      Number(item.sortOrder ?? 0),
    ] as const;

    const id = Number(item.id ?? 0);
    if (id > 0) {
      await database
        .prepare(
          `UPDATE content_items SET
            type = ?, slug = ?, title = ?, subtitle = ?, summary = ?,
            body = ?, metadata = ?, hero_image = ?, gallery = ?, tags = ?,
            featured = ?, published = ?, sort_order = ?,
            updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
        )
        .bind(...values, id)
        .run();
    } else {
      await database
        .prepare(
          `INSERT INTO content_items
            (type, slug, title, subtitle, summary, body, metadata, hero_image,
             gallery, tags, featured, published, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(...values)
        .run();
    }

    revalidatePath("/", "layout");
    return Response.json({ ok: true });
  }

  return Response.json({ error: "Unsupported operation" }, { status: 400 });
}

export async function DELETE(request: Request) {
  const auth = await requireAdminApi();
  if (auth instanceof Response) return auth;

  const url = new URL(request.url);
  const id = Number(url.searchParams.get("id") ?? 0);
  const kind = url.searchParams.get("kind");
  if (!id || !["content", "file", "access-code"].includes(String(kind))) {
    return Response.json({ error: "Invalid delete target" }, { status: 400 });
  }

  const database = await ensureDatabase();
  if (kind === "content") {
    await database.prepare("DELETE FROM content_items WHERE id = ?").bind(id).run();
  } else if (kind === "file") {
    const file = await database
      .prepare("SELECT key FROM files WHERE id = ?")
      .bind(id)
      .first<{ key: string }>();
    if (file) {
      const { getUploadsBucket } = await import("@/lib/site-data");
      await getUploadsBucket().delete(file.key);
    }
    await database.prepare("DELETE FROM files WHERE id = ?").bind(id).run();
  } else {
    await database.prepare("DELETE FROM access_codes WHERE id = ?").bind(id).run();
  }

  revalidatePath("/", "layout");
  return Response.json({ ok: true });
}
