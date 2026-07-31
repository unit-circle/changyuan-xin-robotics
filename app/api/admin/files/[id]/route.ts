import { requireAdminApi } from "@/lib/admin-auth";
import { ensureDatabase, getUploadsBucket } from "@/lib/site-data";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminApi();
  if (auth instanceof Response) return auth;

  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) {
    return new Response("Invalid file", { status: 400 });
  }

  const database = await ensureDatabase();
  const file = await database
    .prepare(
      `SELECT key, name, content_type
       FROM files WHERE id = ? LIMIT 1`,
    )
    .bind(id)
    .first<{ key: string; name: string; content_type: string }>();
  if (!file) return new Response("Not found", { status: 404 });

  const object = await getUploadsBucket().get(file.key);
  if (!object) return new Response("Not found", { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("content-type", file.content_type);
  headers.set("cache-control", "private, no-store, max-age=0");
  headers.set("x-content-type-options", "nosniff");
  return new Response(object.body, { headers });
}
