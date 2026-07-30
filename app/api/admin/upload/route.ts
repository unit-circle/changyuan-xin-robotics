import { requireAdminApi } from "@/lib/admin-auth";
import { ensureDatabase, getUploadsBucket } from "@/lib/site-data";

const allowedTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/zip",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

function safeName(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120) || "upload";
}

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if (auth instanceof Response) return auth;

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "A file is required" }, { status: 400 });
  }
  if (!allowedTypes.has(file.type)) {
    return Response.json({ error: "This file type is not allowed" }, { status: 415 });
  }
  if (file.size > 25 * 1024 * 1024) {
    return Response.json({ error: "Files must be 25 MB or smaller" }, { status: 413 });
  }

  const visibility = form.get("visibility") === "private" ? "private" : "public";
  const requestedScope = String(form.get("requiredScope") ?? "private_basic");
  const requiredScope = [
    "private_basic",
    "private_research",
    "private_academic",
    "private_full",
  ].includes(requestedScope)
    ? requestedScope
    : "private_basic";
  const category = safeName(String(form.get("category") ?? "general"));
  const fileName = safeName(file.name);
  const key = `${visibility}/${category}/${crypto.randomUUID()}-${fileName}`;
  const bucket = getUploadsBucket();
  await bucket.put(key, file.stream(), {
    httpMetadata: { contentType: file.type },
    customMetadata: {
      originalName: file.name,
      uploadedBy: auth.email,
      visibility,
    },
  });

  const database = await ensureDatabase();
  const result = await database
    .prepare(
      `INSERT INTO files
       (key, name, content_type, size, visibility, required_scope, category, title, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      key,
      file.name,
      file.type,
      file.size,
      visibility,
      requiredScope,
      category,
      String(form.get("title") ?? file.name),
      String(form.get("description") ?? ""),
    )
    .run();

  return Response.json({
    ok: true,
    id: result.meta.last_row_id,
    url: `/media/${key}`,
    key,
  });
}
