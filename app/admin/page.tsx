import Link from "next/link";
import { checkAdmin } from "@/lib/admin-auth";
import { AdminDashboard } from "./admin-dashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = await checkAdmin();

  if (!admin.ok) {
    return (
      <main className="admin-gate">
        <div className="admin-gate-card">
          <span>ADMINISTRATION WORKSPACE</span>
          <h1>
            {admin.reason === "not-configured"
              ? "Administrator setup required"
              : "This account is not authorized"}
          </h1>
          <p>
            {admin.reason === "signed-out"
              ? "Cloudflare Access did not provide an authenticated identity. Protect /admin and /api/admin/* with an Access policy before using this workspace."
              : admin.reason === "not-configured"
              ? "Set ADMIN_EMAILS in wrangler.jsonc before publishing. The dashboard will then be available only to the allowed Cloudflare Access account."
              : "Sign in with the administrator account configured for this portfolio."}
          </p>
          <Link href="/">Return to public website</Link>
        </div>
      </main>
    );
  }

  return <AdminDashboard user={admin} />;
}
