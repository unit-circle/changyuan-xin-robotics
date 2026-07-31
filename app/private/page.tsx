import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { AccessForm } from "./access-form";
import { LogoutButton } from "./logout-button";
import { ensureDatabase } from "@/lib/site-data";
import {
  PRIVATE_ACCESS_COOKIE,
  getPrivateSession,
  sessionCanAccessFile,
  type PrivateFileRecord,
} from "@/lib/private-access";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Private Academic Materials",
  robots: { index: false, follow: false, nocache: true },
};

export default async function PrivateMaterials() {
  let session: Awaited<ReturnType<typeof getPrivateSession>> = null;
  let files: PrivateFileRecord[] = [];

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(PRIVATE_ACCESS_COOKIE)?.value;
    const database = await ensureDatabase();
    session = await getPrivateSession(database, token);
    if (session) {
      const result = await database
        .prepare(
          `SELECT
             f.id,
             f.key,
             f.title,
             f.name,
             f.description,
             f.content_type,
             f.required_scope,
             CASE WHEN acf.file_id IS NULL THEN 0 ELSE 1 END AS selected
           FROM files f
           LEFT JOIN access_code_files acf
             ON acf.file_id = f.id AND acf.access_code_id = ?
           WHERE f.visibility = 'private'
           ORDER BY f.created_at DESC, f.id DESC`,
        )
        .bind(session.accessCodeId)
        .all<PrivateFileRecord>();
      files = result.results.filter((file) =>
        session ? sessionCanAccessFile(session, file) : false,
      );
    }
  } catch {
    session = null;
    files = [];
  }

  return (
    <main className="private-page">
      <div className="private-shell">
        <Link className="private-back" href="/">
          ← Return to public portfolio
        </Link>
        <div className="private-card">
          <span className="private-mark">Private academic materials</span>
          {session ? (
            <>
              <div className="private-authorized-heading">
                <div>
                  <h1>Authorized materials</h1>
                  <p>
                    Access granted for <strong>{session.label}</strong>. Only
                    the documents assigned to this reviewer are shown.
                  </p>
                </div>
                <LogoutButton />
              </div>
              <div className="private-file-list">
                {files.length ? (
                  files.map((file) => (
                    <a href={`/media/${file.key}`} key={file.id}>
                      <span>{file.title || file.name}</span>
                      <small>
                        {file.description || "Private academic document"}
                      </small>
                      <i>Download ↗</i>
                    </a>
                  ))
                ) : (
                  <div className="private-empty">
                    No private files are currently assigned to this access code.
                  </div>
                )}
              </div>
              <small className="private-session-note">
                Session expires {session.expiresAt} UTC. Access can be revoked
                immediately by the portfolio administrator.
              </small>
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
              <small>
                Codes are verified securely on the server, may expire, and can
                be revoked at any time.
              </small>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
