import { canAccess } from "@/lib/access-scope";

export const PRIVATE_ACCESS_COOKIE = "xcy-private-session";
export const PRIVATE_ACCESS_MAX_FAILURES = 8;
export const PRIVATE_ACCESS_FAILURE_WINDOW_MINUTES = 15;

export type PrivateSession = {
  tokenHash: string;
  accessCodeId: number;
  label: string;
  scope: string;
  grantMode: "scope" | "selected";
  expiresAt: string;
};

export type PrivateFileRecord = {
  id: number;
  key: string;
  name: string;
  title: string;
  description: string;
  content_type: string;
  required_scope: string;
  selected?: number;
};

function base64Url(bytes: Uint8Array): string {
  let value = "";
  for (const byte of bytes) value += String.fromCharCode(byte);
  return btoa(value)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function normalizeAuthorizationCode(code: string): string {
  return code.trim().toUpperCase();
}

export async function hashAuthorizationCode(code: string): Promise<string> {
  return sha256(normalizeAuthorizationCode(code));
}

export function createSessionToken(): string {
  return base64Url(crypto.getRandomValues(new Uint8Array(32)));
}

export function toSqlTimestamp(date: Date): string {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

export function normalizeExpiry(value: unknown): string | null {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const date = new Date(text);
  if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) {
    return null;
  }
  return toSqlTimestamp(date);
}

export function sessionExpiry(
  sessionHours: number,
  codeExpiresAt: string | null,
): { sql: string; maxAge: number } {
  const requested = Date.now() + sessionHours * 60 * 60 * 1000;
  const codeExpiry = codeExpiresAt
    ? new Date(`${codeExpiresAt.replace(" ", "T")}Z`).getTime()
    : Number.POSITIVE_INFINITY;
  const expiresAt = Math.min(requested, codeExpiry);
  const maxAge = Math.max(60, Math.floor((expiresAt - Date.now()) / 1000));
  return { sql: toSqlTimestamp(new Date(expiresAt)), maxAge };
}

export async function requestIdentity(request: Request): Promise<{
  ipHash: string;
  userAgent: string;
}> {
  const ip =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  return {
    ipHash: await sha256(ip),
    userAgent: (request.headers.get("user-agent") ?? "unknown").slice(0, 240),
  };
}

export async function isRateLimited(
  database: D1Database,
  ipHash: string,
): Promise<boolean> {
  const row = await database
    .prepare(
      `SELECT COUNT(*) AS count
       FROM access_logs
       WHERE action = 'login_failed'
         AND ip_hash = ?
         AND created_at >= datetime('now', '-' || ? || ' minutes')`,
    )
    .bind(ipHash, PRIVATE_ACCESS_FAILURE_WINDOW_MINUTES)
    .first<{ count: number }>();
  return Number(row?.count ?? 0) >= PRIVATE_ACCESS_MAX_FAILURES;
}

export async function logPrivateAccess(
  database: D1Database,
  values: {
    accessCodeId?: number | null;
    fileId?: number | null;
    action: string;
    ipHash?: string;
    userAgent?: string;
    detail?: string;
  },
): Promise<void> {
  await database
    .prepare(
      `INSERT INTO access_logs
       (access_code_id, file_id, action, ip_hash, user_agent, detail)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      values.accessCodeId ?? null,
      values.fileId ?? null,
      values.action,
      values.ipHash ?? "",
      values.userAgent ?? "",
      values.detail ?? "",
    )
    .run();
}

export async function getPrivateSession(
  database: D1Database,
  token: string | undefined,
): Promise<PrivateSession | null> {
  if (!token || token.length < 40) return null;
  const tokenHash = await sha256(token);
  const row = await database
    .prepare(
      `SELECT
         s.token_hash,
         s.access_code_id,
         s.expires_at,
         c.label,
         c.scope,
         c.grant_mode
       FROM private_sessions s
       JOIN access_codes c ON c.id = s.access_code_id
       WHERE s.token_hash = ?
         AND s.revoked_at IS NULL
         AND s.expires_at > CURRENT_TIMESTAMP
         AND c.active = 1
         AND (c.expires_at IS NULL OR c.expires_at > CURRENT_TIMESTAMP)
       LIMIT 1`,
    )
    .bind(tokenHash)
    .first<{
      token_hash: string;
      access_code_id: number;
      expires_at: string;
      label: string;
      scope: string;
      grant_mode: string;
    }>();
  if (!row) return null;
  return {
    tokenHash: row.token_hash,
    accessCodeId: Number(row.access_code_id),
    label: row.label,
    scope: row.scope,
    grantMode: row.grant_mode === "selected" ? "selected" : "scope",
    expiresAt: row.expires_at,
  };
}

export function sessionCanAccessFile(
  session: PrivateSession,
  file: PrivateFileRecord,
): boolean {
  if (!canAccess(session.scope, file.required_scope)) return false;
  return session.grantMode === "scope" || Boolean(file.selected);
}
