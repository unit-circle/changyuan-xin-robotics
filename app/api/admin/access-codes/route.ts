import { requireAdminApi } from "@/lib/admin-auth";
import { ensureDatabase } from "@/lib/site-data";

async function hashCode(code: string): Promise<string> {
  const bytes = new TextEncoder().encode(code.trim().toUpperCase());
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function generateCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  const value = Array.from(bytes)
    .map((byte) => alphabet[byte % alphabet.length])
    .join("");
  return `XCY-${value.slice(0, 4)}-${value.slice(4, 8)}-${value.slice(8, 12)}`;
}

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if (auth instanceof Response) return auth;

  const payload = (await request.json()) as Record<string, unknown>;
  const label = String(payload.label ?? "").trim();
  if (!label) {
    return Response.json({ error: "A reviewer label is required" }, { status: 400 });
  }

  const code = generateCode();
  const codeHash = await hashCode(code);
  const scope = String(payload.scope ?? "private_basic");
  const expiresAt = String(payload.expiresAt ?? "").trim() || null;
  const maxUses = Number(payload.maxUses ?? 0) || null;
  const database = await ensureDatabase();
  const result = await database
    .prepare(
      `INSERT INTO access_codes
       (label, code_hash, scope, expires_at, max_uses)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .bind(label, codeHash, scope, expiresAt, maxUses)
    .run();

  return Response.json({
    ok: true,
    id: result.meta.last_row_id,
    code,
    message: "Copy this code now. Only its hash is stored.",
  });
}

export async function PATCH(request: Request) {
  const auth = await requireAdminApi();
  if (auth instanceof Response) return auth;

  const payload = (await request.json()) as Record<string, unknown>;
  const id = Number(payload.id ?? 0);
  if (!id) return Response.json({ error: "Invalid access code" }, { status: 400 });

  const database = await ensureDatabase();
  await database
    .prepare("UPDATE access_codes SET active = ? WHERE id = ?")
    .bind(payload.active ? 1 : 0, id)
    .run();
  return Response.json({ ok: true });
}
