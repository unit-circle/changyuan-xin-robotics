import { ensureDatabase } from "@/lib/site-data";
import {
  PRIVATE_ACCESS_COOKIE,
  getPrivateSession,
  requestIdentity,
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

export async function POST(request: Request) {
  const database = await ensureDatabase();
  const token = readCookie(request, PRIVATE_ACCESS_COOKIE);
  const session = await getPrivateSession(database, token);
  if (session) {
    const identity = await requestIdentity(request);
    await database.batch([
      database
        .prepare(
          `UPDATE private_sessions
           SET revoked_at = CURRENT_TIMESTAMP
           WHERE token_hash = ?`,
        )
        .bind(session.tokenHash),
      database
        .prepare(
          `INSERT INTO access_logs
           (access_code_id, action, ip_hash, user_agent, detail)
           VALUES (?, 'logout', ?, ?, 'reviewer_logout')`,
        )
        .bind(session.accessCodeId, identity.ipHash, identity.userAgent),
    ]);
  }

  const secure = new URL(request.url).protocol === "https:";
  const response = Response.json(
    { ok: true },
    { headers: { "cache-control": "no-store" } },
  );
  response.headers.append(
    "set-cookie",
    `${PRIVATE_ACCESS_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure ? "; Secure" : ""}`,
  );
  return response;
}
