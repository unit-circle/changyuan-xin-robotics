import { requireAdminApi } from "@/lib/admin-auth";
import { canAccess, isAccessScope } from "@/lib/access-scope";
import { ensureDatabase } from "@/lib/site-data";
import {
  hashAuthorizationCode,
  normalizeExpiry,
} from "@/lib/private-access";

function generateCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  const value = Array.from(bytes)
    .map((byte) => alphabet[byte % alphabet.length])
    .join("");
  return `XCY-${value.slice(0, 4)}-${value.slice(4, 8)}-${value.slice(8, 12)}`;
}

function numberInRange(
  value: unknown,
  minimum: number,
  maximum: number,
  fallback: number,
): number {
  const number = Number(value);
  return Number.isFinite(number)
    ? Math.min(maximum, Math.max(minimum, Math.floor(number)))
    : fallback;
}

function fileIdsFrom(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value
        .map(Number)
        .filter((item) => Number.isInteger(item) && item > 0),
    ),
  );
}

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if (auth instanceof Response) return auth;

  const payload = (await request.json()) as Record<string, unknown>;
  const label = String(payload.label ?? "").trim();
  if (!label) {
    return Response.json({ error: "A reviewer label is required" }, { status: 400 });
  }

  const scope = String(payload.scope ?? "private_basic");
  if (!isAccessScope(scope)) {
    return Response.json({ error: "Invalid access scope" }, { status: 400 });
  }

  const grantMode = payload.grantMode === "scope" ? "scope" : "selected";
  const fileIds = fileIdsFrom(payload.fileIds);
  if (grantMode === "selected" && fileIds.length === 0) {
    return Response.json(
      { error: "Select at least one private file for this reviewer" },
      { status: 400 },
    );
  }

  const database = await ensureDatabase();
  if (fileIds.length) {
    const placeholders = fileIds.map(() => "?").join(",");
    const files = await database
      .prepare(
        `SELECT id, visibility, required_scope
         FROM files WHERE id IN (${placeholders})`,
      )
      .bind(...fileIds)
      .all<{
        id: number;
        visibility: string;
        required_scope: string;
      }>();
    if (
      files.results.length !== fileIds.length ||
      files.results.some(
        (file) =>
          file.visibility !== "private" ||
          !canAccess(scope, file.required_scope),
      )
    ) {
      return Response.json(
        {
          error:
            "Every selected file must be private and compatible with the selected access scope",
        },
        { status: 400 },
      );
    }
  }

  const rawExpiry = String(payload.expiresAt ?? "").trim();
  const expiresAt = normalizeExpiry(rawExpiry);
  if (rawExpiry && !expiresAt) {
    return Response.json(
      { error: "Expiration must be a valid future date and time" },
      { status: 400 },
    );
  }

  const maxUsesValue = Number(payload.maxUses ?? 0);
  const maxUses =
    Number.isFinite(maxUsesValue) && maxUsesValue > 0
      ? numberInRange(maxUsesValue, 1, 10000, 1)
      : null;
  const sessionHours = numberInRange(payload.sessionHours, 1, 720, 24);
  const code = generateCode();
  const codeHash = await hashAuthorizationCode(code);
  const result = await database
    .prepare(
      `INSERT INTO access_codes
       (label, code_hash, scope, grant_mode, expires_at, max_uses, session_hours)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      label,
      codeHash,
      scope,
      grantMode,
      expiresAt,
      maxUses,
      sessionHours,
    )
    .run();
  const id = Number(result.meta.last_row_id);

  if (grantMode === "selected" && fileIds.length) {
    await database.batch(
      fileIds.map((fileId) =>
        database
          .prepare(
            `INSERT INTO access_code_files (access_code_id, file_id)
             VALUES (?, ?)`,
          )
          .bind(id, fileId),
      ),
    );
  }

  return Response.json({
    ok: true,
    id,
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

  const active = payload.active ? 1 : 0;
  const database = await ensureDatabase();
  const statements = [
    database
      .prepare("UPDATE access_codes SET active = ? WHERE id = ?")
      .bind(active, id),
  ];
  if (!active) {
    statements.push(
      database
        .prepare(
          `UPDATE private_sessions
           SET revoked_at = CURRENT_TIMESTAMP
           WHERE access_code_id = ? AND revoked_at IS NULL`,
        )
        .bind(id),
      database
        .prepare(
          `INSERT INTO access_logs (access_code_id, action, detail)
           VALUES (?, 'revoked', 'administrator_action')`,
        )
        .bind(id),
    );
  }
  await database.batch(statements);
  return Response.json({ ok: true });
}
