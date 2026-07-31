import { ensureDatabase } from "@/lib/site-data";
import {
  PRIVATE_ACCESS_COOKIE,
  PRIVATE_ACCESS_FAILURE_WINDOW_MINUTES,
  createSessionToken,
  hashAuthorizationCode,
  isRateLimited,
  logPrivateAccess,
  normalizeAuthorizationCode,
  requestIdentity,
  sessionExpiry,
  sha256,
} from "@/lib/private-access";

type AccessCodeRow = {
  id: number;
  expires_at: string | null;
  session_hours: number;
};

function noStoreJson(body: object, status = 200): Response {
  return Response.json(body, {
    status,
    headers: { "cache-control": "no-store" },
  });
}

export async function POST(request: Request) {
  let payload: { code?: string };
  try {
    payload = (await request.json()) as { code?: string };
  } catch {
    return noStoreJson({ error: "The request could not be read" }, 400);
  }

  const code = normalizeAuthorizationCode(String(payload.code ?? ""));
  const database = await ensureDatabase();
  const identity = await requestIdentity(request);

  if (await isRateLimited(database, identity.ipHash)) {
    return Response.json(
      {
        error:
          "Too many unsuccessful attempts. Please wait 15 minutes before trying again.",
      },
      {
        status: 429,
        headers: {
          "cache-control": "no-store",
          "retry-after": String(PRIVATE_ACCESS_FAILURE_WINDOW_MINUTES * 60),
        },
      },
    );
  }

  if (!/^XCY-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(code)) {
    await logPrivateAccess(database, {
      action: "login_failed",
      ...identity,
      detail: "invalid_format",
    });
    return noStoreJson({ error: "Enter a valid authorization code" }, 400);
  }

  const codeHash = await hashAuthorizationCode(code);
  const update = await database
    .prepare(
      `UPDATE access_codes
       SET use_count = use_count + 1,
           last_used_at = CURRENT_TIMESTAMP
       WHERE code_hash = ?
         AND active = 1
         AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
         AND (max_uses IS NULL OR use_count < max_uses)`,
    )
    .bind(codeHash)
    .run();

  if (Number(update.meta.changes ?? 0) !== 1) {
    await logPrivateAccess(database, {
      action: "login_failed",
      ...identity,
      detail: "invalid_expired_revoked_or_exhausted",
    });
    return noStoreJson(
      {
        error:
          "The authorization code is invalid, expired, fully used, or no longer active",
      },
      403,
    );
  }

  const access = await database
    .prepare(
      `SELECT id, expires_at, session_hours
       FROM access_codes
       WHERE code_hash = ?
       LIMIT 1`,
    )
    .bind(codeHash)
    .first<AccessCodeRow>();

  if (!access) {
    return noStoreJson({ error: "Access could not be established" }, 500);
  }

  const token = createSessionToken();
  const tokenHash = await sha256(token);
  const expiry = sessionExpiry(
    Math.min(720, Math.max(1, Number(access.session_hours ?? 24))),
    access.expires_at,
  );

  await database.batch([
    database
      .prepare(
        `INSERT INTO private_sessions
         (token_hash, access_code_id, expires_at)
         VALUES (?, ?, ?)`,
      )
      .bind(tokenHash, access.id, expiry.sql),
    database
      .prepare(
        `INSERT INTO access_logs
         (access_code_id, action, ip_hash, user_agent, detail)
         VALUES (?, 'login_success', ?, ?, 'authorization_code')`,
      )
      .bind(access.id, identity.ipHash, identity.userAgent),
    database
      .prepare(
        `DELETE FROM private_sessions
         WHERE expires_at <= CURRENT_TIMESTAMP
            OR revoked_at IS NOT NULL`,
      ),
  ]);

  const secure = new URL(request.url).protocol === "https:";
  const response = noStoreJson({ ok: true, expiresAt: expiry.sql });
  response.headers.append(
    "set-cookie",
    `${PRIVATE_ACCESS_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${expiry.maxAge}${secure ? "; Secure" : ""}`,
  );
  return response;
}
