import { ensureDatabase, getUploadsBucket } from "@/lib/site-data";
import {
  PRIVATE_ACCESS_COOKIE,
  getPrivateSession,
  requestIdentity,
  sessionCanAccessFile,
  type PrivateFileRecord,
  type PrivateSession,
} from "@/lib/private-access";

function readCookie(request: Request, name: string): string | undefined {
  const prefix = `${name}=`;
  return request.headers
    .get("cookie")
    ?.split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(prefix))
    ?.slice(prefix.length);
}

function safeDownloadName(name: string): string {
  return encodeURIComponent(name.replace(/[\r\n"]/g, "_"));
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { key: parts } = await params;
  const key = parts.join("/");
  const database = await ensureDatabase();
  const metadata = await database
    .prepare(
      `SELECT
         f.id,
         f.key,
         f.name,
         f.title,
         f.description,
         f.visibility,
         f.required_scope,
         f.content_type
       FROM files f
       WHERE f.key = ?
       LIMIT 1`,
    )
    .bind(key)
    .first<
      PrivateFileRecord & {
        visibility: string;
      }
    >();

  if (!metadata) return new Response("Not found", { status: 404 });

  let authorizedSession: PrivateSession | null = null;
  if (metadata.visibility === "private") {
    const token = readCookie(request, PRIVATE_ACCESS_COOKIE);
    const session = await getPrivateSession(database, token);
    if (!session) {
      return new Response("Authorization required", {
        status: 401,
        headers: { "cache-control": "no-store" },
      });
    }

    if (session.grantMode === "selected") {
      const assignment = await database
        .prepare(
          `SELECT 1 AS selected
           FROM access_code_files
           WHERE access_code_id = ? AND file_id = ?
           LIMIT 1`,
        )
        .bind(session.accessCodeId, metadata.id)
        .first<{ selected: number }>();
      metadata.selected = Number(assignment?.selected ?? 0);
    }

    if (!sessionCanAccessFile(session, metadata)) {
      return new Response("Authorization expired or insufficient", {
        status: 403,
        headers: { "cache-control": "no-store" },
      });
    }
    authorizedSession = session;
  }

  const object = await getUploadsBucket().get(key);
  if (!object) return new Response("Not found", { status: 404 });

  if (authorizedSession) {
    const identity = await requestIdentity(request);
    await database.batch([
      database
        .prepare(
          `UPDATE private_sessions
           SET last_seen_at = CURRENT_TIMESTAMP
           WHERE token_hash = ?`,
        )
        .bind(authorizedSession.tokenHash),
      database
        .prepare(
          `INSERT INTO access_logs
           (access_code_id, file_id, action, ip_hash, user_agent, detail)
           VALUES (?, ?, 'download', ?, ?, ?)`,
        )
        .bind(
          authorizedSession.accessCodeId,
          metadata.id,
          identity.ipHash,
          identity.userAgent,
          metadata.name,
        ),
    ]);
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("content-type", metadata.content_type);
  headers.set(
    "cache-control",
    metadata.visibility === "public"
      ? "public, max-age=3600"
      : "private, no-store, max-age=0",
  );
  headers.set("x-content-type-options", "nosniff");
  headers.set("etag", object.httpEtag);
  if (metadata.visibility === "private") {
    headers.set(
      "content-disposition",
      `attachment; filename*=UTF-8''${safeDownloadName(metadata.name)}`,
    );
  }
  return new Response(object.body, { headers });
}
