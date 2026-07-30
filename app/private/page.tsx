import Link from "next/link";
import { cookies } from "next/headers";
import { AccessForm } from "./access-form";
import { ensureDatabase } from "@/lib/site-data";
import { canAccess } from "@/lib/access-scope";

export const dynamic = "force-dynamic";

export default async function PrivateMaterials() {
  let authorized = false;
  let files: Array<{
    id: number;
    key: string;
    title: string;
    name: string;
    description: string;
    required_scope: string;
  }> = [];

  try {
    const cookieStore = await cookies();
    const accessHash = cookieStore.get("xcy-private-access")?.value;
    if (accessHash) {
      const database = await ensureDatabase();
      const access = await database
        .prepare(
          `SELECT id, scope FROM access_codes
           WHERE code_hash = ? AND active = 1
             AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
           LIMIT 1`,
        )
        .bind(accessHash)
        .first<{ id: number; scope: string }>();
      authorized = Boolean(access);
      if (authorized) {
        const result = await database
          .prepare(
            `SELECT id, key, title, name, description, required_scope
             FROM files WHERE visibility = 'private'
             ORDER BY created_at DESC`,
          )
          .all<{
            id: number;
            key: string;
            title: string;
            name: string;
            description: string;
            required_scope: string;
          }>();
        files = result.results.filter((file) =>
          canAccess(String(access?.scope), file.required_scope),
        );
      }
    }
  } catch {
    authorized = false;
  }

  return (
    <main className="private-page">
      <div className="private-shell">
        <Link className="private-back" href="/">
          ← Return to public portfolio
        </Link>
        <div className="private-card">
          <span className="private-mark">Private academic materials</span>
          {authorized ? (
            <>
              <h1>Authorized materials</h1>
              <p>
                This session has permission to view the selected private
                academic materials below.
              </p>
              <div className="private-file-list">
                {files.length ? files.map((file) => (
                  <a href={`/media/${file.key}`} key={file.id}>
                    <span>{file.title || file.name}</span>
                    <small>{file.description || "Private academic document"}</small>
                    <i>Download ↗</i>
                  </a>
                )) : (
                  <p>No private files have been published for this access area yet.</p>
                )}
              </div>
            </>
          ) : (
            <>
              <h1>Authorized access</h1>
              <p>
                This reserved area contains selected academic documents for
                authorized reviewers. Enter the code provided with your
                invitation.
              </p>
              <AccessForm />
              <small>Codes are verified securely on the server and may expire.</small>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
