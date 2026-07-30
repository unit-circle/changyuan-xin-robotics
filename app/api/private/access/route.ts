import { ensureDatabase } from "@/lib/site-data";

async function hashCode(code: string): Promise<string> {
  const bytes = new TextEncoder().encode(code.trim().toUpperCase());
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function POST(request: Request) {
  const payload = (await request.json()) as { code?: string };
  const code = String(payload.code ?? "").trim();
  if (code.length < 8) {
    return Response.json({ error: "Enter a valid authorization code" }, { status: 400 });
  }

  const codeHash = await hashCode(code);
  const database = await ensureDatabase();
  const access = await database
    .prepare(
      `SELECT id, expires_at, max_uses, use_count
       FROM access_codes
       WHERE code_hash = ? AND active = 1
         AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
         AND (max_uses IS NULL OR use_count < max_uses)
       LIMIT 1`,
    )
    .bind(codeHash)
    .first<{
      id: number;
      expires_at: string | null;
      max_uses: number | null;
      use_count: number;
    }>();

  if (!access) {
    return Response.json(
      { error: "The authorization code is invalid, expired, or no longer active" },
      { status: 403 },
    );
  }

  await database.batch([
    database
      .prepare("UPDATE access_codes SET use_count = use_count + 1 WHERE id = ?")
      .bind(access.id),
    database
      .prepare("INSERT INTO access_logs (access_code_id, action) VALUES (?, 'login')")
      .bind(access.id),
  ]);

  const response = Response.json({ ok: true });
  const secure = new URL(request.url).protocol === "https:";
  response.headers.append(
    "set-cookie",
    `xcy-private-access=${codeHash}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400${secure ? "; Secure" : ""}`,
  );
  return response;
}
