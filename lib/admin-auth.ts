import { getCloudflareAccessUser } from "@/app/cloudflare-auth";
import { getAdminEmails } from "@/lib/site-data";

export type AdminCheck =
  | { ok: true; email: string; displayName: string }
  | { ok: false; reason: "signed-out" | "not-configured" | "forbidden" };

export async function checkAdmin(): Promise<AdminCheck> {
  const user = await getCloudflareAccessUser();
  if (!user) return { ok: false, reason: "signed-out" };

  const allowed = getAdminEmails();
  if (allowed.length === 0) {
    return { ok: false, reason: "not-configured" };
  }
  if (!allowed.includes(user.email.toLowerCase())) {
    return { ok: false, reason: "forbidden" };
  }

  return {
    ok: true,
    email: user.email,
    displayName: user.displayName,
  };
}

export async function requireAdminApi(): Promise<
  Response | Extract<AdminCheck, { ok: true }>
> {
  const result = await checkAdmin();
  if (result.ok) return result;

  return Response.json(
    {
      error:
        result.reason === "signed-out"
          ? "Authentication required"
          : result.reason === "not-configured"
            ? "ADMIN_EMAILS is not configured"
            : "This account is not authorized",
    },
    { status: result.reason === "signed-out" ? 401 : 403 },
  );
}
