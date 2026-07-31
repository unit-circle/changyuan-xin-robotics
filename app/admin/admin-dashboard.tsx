"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

export type AdminUser = { ok: true; email: string; displayName: string };
type ContentType = "project" | "coursework" | "publication";
export type ContentItem = {
  id: number;
  type: ContentType;
  slug: string;
  title: string;
  subtitle: string;
  summary: string;
  body: Record<string, unknown>;
  metadata: Record<string, unknown>;
  heroImage: string;
  gallery: string[];
  tags: string[];
  featured: boolean;
  published: boolean;
  sortOrder: number;
};
export type AdminData = {
  settings: {
    profile: Record<string, string>;
    researchInterests: Array<Record<string, string>>;
    experiences: Array<Record<string, string>>;
    resources: Array<Record<string, string>>;
    skills: string[];
  };
  content: {
    projects: ContentItem[];
    coursework: ContentItem[];
    publications: ContentItem[];
  };
  files: Array<Record<string, unknown>>;
  accessCodes: Array<Record<string, unknown>>;
  accessLogs: Array<Record<string, unknown>>;
};

const tabs = [
  ["overview", "Overview"],
  ["profile", "Profile"],
  ["projects", "Projects"],
  ["coursework", "Coursework"],
  ["publications", "Publications"],
  ["files", "Files"],
  ["access", "Access Codes"],
] as const;

const emptyItem = (type: ContentType): ContentItem => ({
  id: 0,
  type,
  slug: "",
  title: "",
  subtitle: "",
  summary: "",
  body: {},
  metadata: {},
  heroImage: "",
  gallery: [],
  tags: [],
  featured: false,
  published: true,
  sortOrder: 0,
});

function lines(value: unknown): string {
  return Array.isArray(value) ? value.map(String).join("\n") : "";
}

function lineArray(value: string): string[] {
  return value.split("\n").map((item) => item.trim()).filter(Boolean);
}

function commaArray(value: string): string[] {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function recordLines(
  records: Array<Record<string, string>>,
  keys: string[],
): string {
  return records
    .map((record) => keys.map((key) => record[key] ?? "").join(" | "))
    .join("\n");
}

function parseRecordLines(
  value: string,
  keys: string[],
): Array<Record<string, string>> {
  return lineArray(value).map((line) => {
    const cells = line.split("|").map((cell) => cell.trim());
    return Object.fromEntries(keys.map((key, index) => [key, cells[index] ?? ""]));
  });
}

export function AdminDashboard({
  user,
  initialData = null,
  preview = false,
}: {
  user: AdminUser;
  initialData?: AdminData | null;
  preview?: boolean;
}) {
  const [activeTab, setActiveTab] = useState("overview");
  const [data, setData] = useState<AdminData | null>(initialData);
  const [editor, setEditor] = useState<ContentItem | null>(null);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (preview) return;
    const response = await fetch("/api/admin/content", { cache: "no-store" });
    if (!response.ok) {
      setNotice("The administration data could not be loaded.");
      return;
    }
    setData((await response.json()) as AdminData);
  }, [preview]);

  useEffect(() => {
    if (preview || initialData) return;
    const task = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(task);
  }, [initialData, load, preview]);

  const contentList = useMemo(() => {
    if (!data) return [];
    if (activeTab === "projects") return data.content.projects;
    if (activeTab === "coursework") return data.content.coursework;
    if (activeTab === "publications") return data.content.publications;
    return [];
  }, [activeTab, data]);

  const activeType: ContentType =
    activeTab === "coursework"
      ? "coursework"
      : activeTab === "publications"
        ? "publication"
        : "project";

  async function saveItem(item: ContentItem) {
    if (preview) {
      setNotice("Preview mode: content changes are disabled in the local walkthrough.");
      setEditor(null);
      return;
    }
    setBusy(true);
    setNotice("");
    const response = await fetch("/api/admin/content", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ operation: "content", item }),
    });
    const result = (await response.json()) as { error?: string };
    setBusy(false);
    if (!response.ok) {
      setNotice(result.error ?? "The item could not be saved.");
      return;
    }
    setNotice("Saved. The public website has been refreshed.");
    setEditor(null);
    await load();
  }

  async function deleteItem(item: ContentItem) {
    if (preview) {
      setNotice("Preview mode: delete actions are disabled.");
      return;
    }
    if (!window.confirm(`Delete “${item.title}”? This cannot be undone.`)) return;
    const response = await fetch(
      `/api/admin/content?kind=content&id=${item.id}`,
      { method: "DELETE" },
    );
    if (!response.ok) {
      setNotice("The item could not be deleted.");
      return;
    }
    setNotice("Item deleted.");
    await load();
  }

  async function saveSettings(settings: AdminData["settings"]) {
    if (preview) {
      setNotice("Preview mode: profile changes are not written.");
      return;
    }
    setBusy(true);
    const response = await fetch("/api/admin/content", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ operation: "settings", settings }),
    });
    setBusy(false);
    setNotice(response.ok ? "Profile settings saved." : "Profile settings could not be saved.");
    if (response.ok) await load();
  }

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="admin-brand" href="/">
          <span className="logo-cube"><i /></span>
          <div><strong>XCY</strong><small>CONTENT STUDIO</small></div>
        </Link>
        <nav>
          {tabs.map(([id, label], index) => (
            <button
              className={activeTab === id ? "active" : ""}
              key={id}
              onClick={() => {
                setActiveTab(id);
                setEditor(null);
              }}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>{label}
            </button>
          ))}
        </nav>
        <div className="admin-account">
          <span>Signed in as</span>
          <strong>{user.displayName}</strong>
          <small>{user.email}</small>
          <a href="/cdn-cgi/access/logout">Sign out</a>
        </div>
      </aside>

      <section className="admin-workspace">
        <header>
          <div>
            <span>PORTFOLIO ADMINISTRATION</span>
            <h1>{tabs.find(([id]) => id === activeTab)?.[1]}</h1>
          </div>
          <div>
            <a href="/" target="_blank">View website ↗</a>
            {["projects", "coursework", "publications"].includes(activeTab) && (
              <button onClick={() => setEditor(emptyItem(activeType))}>+ New item</button>
            )}
          </div>
        </header>

        {preview && (
          <div className="admin-preview-banner">
            LOCAL PREVIEW · You can inspect every workspace tab; write actions
            are disabled until the authenticated site is deployed.
          </div>
        )}
        {notice && <div className="admin-notice">{notice}</div>}
        {!data ? (
          <div className="admin-loading">Loading content workspace…</div>
        ) : activeTab === "overview" ? (
          <Overview data={data} setActiveTab={setActiveTab} />
        ) : activeTab === "profile" ? (
          <ProfileEditor
            busy={busy}
            initial={data.settings}
            onSave={saveSettings}
          />
        ) : ["projects", "coursework", "publications"].includes(activeTab) ? (
          <ContentManager
            items={contentList}
            onDelete={deleteItem}
            onEdit={setEditor}
            type={activeType}
          />
        ) : activeTab === "files" ? (
          <FileManager data={data} onChange={load} preview={preview} setNotice={setNotice} />
        ) : (
          <AccessManager data={data} onChange={load} preview={preview} setNotice={setNotice} />
        )}
      </section>

      {editor && (
        <ContentEditor
          busy={busy}
          item={editor}
          onCancel={() => setEditor(null)}
          onChange={setEditor}
          onSave={saveItem}
        />
      )}
    </main>
  );
}

function Overview({
  data,
  setActiveTab,
}: {
  data: AdminData;
  setActiveTab: (tab: string) => void;
}) {
  const stats = [
    ["Projects", data.content.projects.length, "projects"],
    ["Course areas", data.content.coursework.length, "coursework"],
    ["Research outputs", data.content.publications.length, "publications"],
    ["Uploaded files", data.files.length, "files"],
  ];

  return (
    <div className="admin-overview">
      <section className="admin-welcome">
        <div>
          <span>WORKSPACE READY</span>
          <h2>Keep the public portfolio current without editing code.</h2>
          <p>
            Update profile information, publish project dossiers, attach files,
            manage imagery, and issue reviewer access codes from one place.
          </p>
        </div>
        <div className="admin-orbit"><span>CONTENT</span><i /><b>LIVE</b></div>
      </section>
      <section className="admin-stats">
        {stats.map(([label, value, tab], index) => (
          <button key={String(label)} onClick={() => setActiveTab(String(tab))}>
            <span>0{index + 1}</span><strong>{String(value).padStart(2, "0")}</strong>
            <small>{label}</small>
          </button>
        ))}
      </section>
      <section className="admin-checklist">
        <div>
          <span>BEFORE DEPLOYMENT</span>
          <h3>Publication readiness</h3>
        </div>
        {[
          "Replace the portrait placeholder with a formal photograph",
          "Confirm the public email and academic links",
          "Upload the final PDF CV and selected public reports",
          "Review project descriptions and publication status",
        ].map((item, index) => (
          <p key={item}><span>{index + 1}</span>{item}</p>
        ))}
      </section>
    </div>
  );
}

function ContentManager({
  items,
  onEdit,
  onDelete,
  type,
}: {
  items: ContentItem[];
  onEdit: (item: ContentItem) => void;
  onDelete: (item: ContentItem) => void;
  type: ContentType;
}) {
  return (
    <div className="admin-content-list">
      <div className="admin-list-intro">
        <span>{type.toUpperCase()} COLLECTION</span>
        <p>Drag ordering will be added later; use the order field for now.</p>
      </div>
      {items.map((item) => (
        <article key={item.id}>
          <figure>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.heroImage || "/research-orb.png"} alt="" />
          </figure>
          <div>
            <span>{item.published ? "PUBLISHED" : "DRAFT"} · ORDER {item.sortOrder}</span>
            <h2>{item.title}</h2>
            <p>{item.summary}</p>
            <div className="tag-list">
              {item.tags.slice(0, 4).map((tag) => <span key={tag}>{tag}</span>)}
            </div>
          </div>
          <aside>
            <button onClick={() => onEdit(item)}>Edit</button>
            <a
              href={
                type === "project"
                  ? `/research/${item.slug}`
                  : type === "coursework"
                    ? `/coursework/${item.slug}`
                    : `/publications#${item.slug}`
              }
              target="_blank"
            >
              Preview ↗
            </a>
            <button className="danger" onClick={() => onDelete(item)}>Delete</button>
          </aside>
        </article>
      ))}
    </div>
  );
}

function ProfileEditor({
  initial,
  onSave,
  busy,
}: {
  initial: AdminData["settings"];
  onSave: (settings: AdminData["settings"]) => void;
  busy: boolean;
}) {
  const [settings, setSettings] = useState(initial);
  const profile = settings.profile;
  const update = (key: string, value: string) =>
    setSettings({
      ...settings,
      profile: { ...settings.profile, [key]: value },
    });
  const updateRecords = (
    key: "researchInterests" | "experiences" | "resources",
    value: string,
    columns: string[],
  ) => setSettings({
    ...settings,
    [key]: parseRecordLines(value, columns),
  });

  return (
    <form
      className="admin-form profile-form"
      onSubmit={(event) => {
        event.preventDefault();
        void onSave(settings);
      }}
    >
      <section>
        <div><span>IDENTITY</span><h2>Profile and academic position</h2></div>
        <div className="admin-field-grid">
          <Field label="English name" value={profile.name ?? ""} onChange={(v) => update("name", v)} />
          <Field label="Chinese name" value={profile.chineseName ?? ""} onChange={(v) => update("chineseName", v)} />
          <Field label="Academic role" value={profile.role ?? ""} onChange={(v) => update("role", v)} />
          <Field label="University" value={profile.university ?? ""} onChange={(v) => update("university", v)} />
          <Field label="School" value={profile.school ?? ""} onChange={(v) => update("school", v)} />
          <Field label="Degree" value={profile.degree ?? ""} onChange={(v) => update("degree", v)} />
          <Field label="Location" value={profile.location ?? ""} onChange={(v) => update("location", v)} />
          <Field label="Availability" value={profile.availability ?? ""} onChange={(v) => update("availability", v)} />
        </div>
      </section>
      <section>
        <div><span>NARRATIVE</span><h2>Homepage introduction</h2></div>
        <Field area label="Research focus" value={profile.focus ?? ""} onChange={(v) => update("focus", v)} />
        <Field area label="Short biography" value={profile.bio ?? ""} onChange={(v) => update("bio", v)} />
        <Field area label="Signature quote" value={profile.quote ?? ""} onChange={(v) => update("quote", v)} />
      </section>
      <section>
        <div><span>CONTACT</span><h2>Links and portrait</h2></div>
        <div className="admin-field-grid">
          <Field label="Email" value={profile.email ?? ""} onChange={(v) => update("email", v)} />
          <Field label="GitHub URL" value={profile.github ?? ""} onChange={(v) => update("github", v)} />
          <Field label="Google Scholar URL" value={profile.scholar ?? ""} onChange={(v) => update("scholar", v)} />
          <Field label="ORCID URL" value={profile.orcid ?? ""} onChange={(v) => update("orcid", v)} />
          <Field label="LinkedIn URL" value={profile.linkedin ?? ""} onChange={(v) => update("linkedin", v)} />
        </div>
        <Field label="Portrait image URL" value={profile.portrait ?? ""} onChange={(v) => update("portrait", v)} />
      </section>
      <section>
        <div><span>HOMEPAGE COLLECTIONS</span><h2>Cards, experience and resources</h2></div>
        <Field
          area
          label="Research interests — title | detail | color tone"
          value={recordLines(settings.researchInterests, ["title", "detail", "tone"])}
          onChange={(value) => updateRecords("researchInterests", value, ["title", "detail", "tone"])}
        />
        <Field
          area
          label="Experience — category | title | organization | URL | link label"
          value={recordLines(settings.experiences, ["period", "title", "place", "href", "action"])}
          onChange={(value) => updateRecords("experiences", value, ["period", "title", "place", "href", "action"])}
        />
        <Field
          area
          label="Resources — title | description | image URL | destination URL"
          value={recordLines(settings.resources, ["title", "detail", "image", "href"])}
          onChange={(value) => updateRecords("resources", value, ["title", "detail", "image", "href"])}
        />
        <Field
          area
          label="Skills — one per line"
          value={settings.skills.join("\n")}
          onChange={(value) => setSettings({ ...settings, skills: lineArray(value) })}
        />
      </section>
      <button className="admin-save" disabled={busy} type="submit">
        {busy ? "Saving…" : "Save profile changes"}
      </button>
    </form>
  );
}

function ContentEditor({
  item,
  onChange,
  onCancel,
  onSave,
  busy,
}: {
  item: ContentItem;
  onChange: (item: ContentItem) => void;
  onCancel: () => void;
  onSave: (item: ContentItem) => void;
  busy: boolean;
}) {
  const set = <K extends keyof ContentItem>(key: K, value: ContentItem[K]) =>
    onChange({ ...item, [key]: value });
  const setMeta = (key: string, value: string) =>
    set("metadata", { ...item.metadata, [key]: value });
  const setBody = (key: string, value: string | string[]) =>
    set("body", { ...item.body, [key]: value });

  return (
    <div className="admin-editor-backdrop">
      <form
        className="admin-editor"
        onSubmit={(event) => {
          event.preventDefault();
          void onSave(item);
        }}
      >
        <header>
          <div><span>CONTENT EDITOR</span><h2>{item.id ? "Edit item" : "Create item"}</h2></div>
          <button onClick={onCancel} type="button">Close</button>
        </header>
        <div className="admin-editor-body">
          <section>
            <span>BASIC INFORMATION</span>
            <Field label="Title" value={item.title} onChange={(v) => set("title", v)} />
            <div className="admin-field-grid">
              <Field label="URL slug" value={item.slug} onChange={(v) => set("slug", v.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} />
              <Field label="Short title" value={item.subtitle} onChange={(v) => set("subtitle", v)} />
            </div>
            <Field area label="Summary" value={item.summary} onChange={(v) => set("summary", v)} />
            <Field label="Hero image URL" value={item.heroImage} onChange={(v) => set("heroImage", v)} />
            <Field label="Tags (comma separated)" value={item.tags.join(", ")} onChange={(v) => set("tags", commaArray(v))} />
            <Field area label="Gallery image URLs (one per line)" value={item.gallery.join("\n")} onChange={(v) => set("gallery", lineArray(v))} />
          </section>

          {item.type === "project" && (
            <section>
              <span>PROJECT DOSSIER</span>
              <div className="admin-field-grid">
                <Field label="Label" value={String(item.metadata.label ?? "")} onChange={(v) => setMeta("label", v)} />
                <Field label="Period" value={String(item.metadata.period ?? "")} onChange={(v) => setMeta("period", v)} />
                <Field label="Role" value={String(item.metadata.role ?? "")} onChange={(v) => setMeta("role", v)} />
                <Field label="Status" value={String(item.metadata.status ?? "")} onChange={(v) => setMeta("status", v)} />
              </div>
              <Field area label="Research challenge" value={String(item.body.challenge ?? "")} onChange={(v) => setBody("challenge", v)} />
              <Field area label="Approach (one point per line)" value={lines(item.body.approach)} onChange={(v) => setBody("approach", lineArray(v))} />
              <Field area label="Contributions (one per line)" value={lines(item.body.contributions)} onChange={(v) => setBody("contributions", lineArray(v))} />
              <Field area label="Outcomes (one per line)" value={lines(item.body.outcomes)} onChange={(v) => setBody("outcomes", lineArray(v))} />
            </section>
          )}

          {item.type === "coursework" && (
            <section>
              <span>COURSE EVIDENCE</span>
              <Field area label="Courses (one per line)" value={lines(item.body.items)} onChange={(v) => setBody("items", lineArray(v))} />
              <Field area label="Skills (one per line)" value={lines(item.body.skills)} onChange={(v) => setBody("skills", lineArray(v))} />
              <Field area label="Evidence types (one per line)" value={lines(item.body.evidence)} onChange={(v) => setBody("evidence", lineArray(v))} />
              <Field label="Color tone" value={String(item.metadata.tone ?? "blue")} onChange={(v) => setMeta("tone", v)} />
            </section>
          )}

          {item.type === "publication" && (
            <section>
              <span>OUTPUT DETAILS</span>
              <Field label="Status" value={String(item.metadata.status ?? "")} onChange={(v) => setMeta("status", v)} />
              <Field label="Format" value={String(item.metadata.format ?? "")} onChange={(v) => setMeta("format", v)} />
              <Field label="Metadata line" value={String(item.metadata.meta ?? "")} onChange={(v) => setMeta("meta", v)} />
            </section>
          )}

          <section>
            <span>DISPLAY</span>
            <div className="admin-field-grid">
              <Field label="Display order" type="number" value={String(item.sortOrder)} onChange={(v) => set("sortOrder", Number(v))} />
              <label className="admin-check"><input checked={item.published} onChange={(e) => set("published", e.target.checked)} type="checkbox" />Published</label>
              <label className="admin-check"><input checked={item.featured} onChange={(e) => set("featured", e.target.checked)} type="checkbox" />Featured</label>
            </div>
          </section>
        </div>
        <footer>
          <button onClick={onCancel} type="button">Cancel</button>
          <button className="admin-save" disabled={busy} type="submit">
            {busy ? "Saving…" : "Save content"}
          </button>
        </footer>
      </form>
    </div>
  );
}

function FileManager({
  data,
  onChange,
  preview,
  setNotice,
}: {
  data: AdminData;
  onChange: () => Promise<void>;
  preview: boolean;
  setNotice: (message: string) => void;
}) {
  const [uploading, setUploading] = useState(false);

  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (preview) {
      setNotice("Preview mode: uploads are enabled after authenticated deployment.");
      return;
    }
    setUploading(true);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/upload", { method: "POST", body: form });
    const result = (await response.json()) as { error?: string; url?: string };
    setUploading(false);
    if (!response.ok) {
      setNotice(result.error ?? "Upload failed.");
      return;
    }
    setNotice(`Uploaded successfully: ${result.url}`);
    event.currentTarget.reset();
    await onChange();
  }

  async function remove(id: number, name: string) {
    if (preview) {
      setNotice("Preview mode: file deletion is disabled.");
      return;
    }
    if (!window.confirm(`Delete “${name}” from storage?`)) return;
    const response = await fetch(`/api/admin/content?kind=file&id=${id}`, { method: "DELETE" });
    setNotice(response.ok ? "File deleted." : "File could not be deleted.");
    if (response.ok) await onChange();
  }

  return (
    <div className="file-manager">
      <form className="upload-panel" onSubmit={upload}>
        <div><span>R2 FILE STORAGE</span><h2>Upload image or document</h2></div>
        <input accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,.zip,.docx,.pptx" name="file" required type="file" />
        <div className="admin-field-grid">
          <Field label="Display title" name="title" value="" uncontrolled />
          <Field label="Category" name="category" value="general" uncontrolled />
        </div>
        <Field area label="Description" name="description" value="" uncontrolled />
        <label>
          Visibility
          <select defaultValue="public" name="visibility">
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </label>
        <label>
          Required private access level
          <select defaultValue="private_basic" name="requiredScope">
            <option value="private_basic">Basic private materials</option>
            <option value="private_research">Unpublished research</option>
            <option value="private_academic">Academic documents</option>
            <option value="private_full">Full access only</option>
          </select>
        </label>
        <button className="admin-save" disabled={uploading} type="submit">
          {uploading ? "Uploading…" : "Upload file"}
        </button>
        <small>Accepted: JPG, PNG, WebP, GIF, PDF, ZIP, DOCX, PPTX · maximum 25 MB.</small>
      </form>

      <section className="stored-files">
        <header><span>STORED FILES</span><strong>{data.files.length}</strong></header>
        {data.files.map((file) => {
          const fileUrl =
            String(file.visibility) === "private"
              ? `/api/admin/files/${String(file.id)}`
              : String(file.preview_url ?? `/media/${String(file.key)}`);
          return (
          <article key={String(file.id)}>
            {String(file.content_type).startsWith("image/") && (
              <figure className="stored-file-preview">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt="" src={fileUrl} />
              </figure>
            )}
            <div>
              <span>{String(file.visibility).toUpperCase()} · {String(file.category)}</span>
              <h3>{String(file.title || file.name)}</h3>
              <small>
                {String(file.content_type)} · {Math.ceil(Number(file.size) / 1024)} KB
                {String(file.visibility) === "private"
                  ? ` · ${String(file.required_scope)}`
                  : ""}
              </small>
            </div>
            <div>
              <button onClick={() => navigator.clipboard.writeText(fileUrl)}>Copy URL</button>
              <a href={fileUrl} target="_blank">Open ↗</a>
              <button className="danger" onClick={() => remove(Number(file.id), String(file.name))}>Delete</button>
            </div>
          </article>
        )})}
      </section>
    </div>
  );
}

function AccessManager({
  data,
  onChange,
  preview,
  setNotice,
}: {
  data: AdminData;
  onChange: () => Promise<void>;
  preview: boolean;
  setNotice: (message: string) => void;
}) {
  const [createdCode, setCreatedCode] = useState("");
  const [grantMode, setGrantMode] = useState<"selected" | "scope">("selected");
  const privateFiles = data.files.filter(
    (file) => String(file.visibility) === "private",
  );

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (preview) {
      setNotice("Preview mode: secure codes can be generated after deployment.");
      return;
    }
    const form = new FormData(event.currentTarget);
    const expiresAt = String(form.get("expiresAt") ?? "").trim();
    const payload = {
      ...Object.fromEntries(form.entries()),
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : "",
      fileIds: form.getAll("fileIds").map(Number),
    };
    const response = await fetch("/api/admin/access-codes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = (await response.json()) as { code?: string; error?: string };
    if (!response.ok) {
      setNotice(result.error ?? "Access code could not be created.");
      return;
    }
    setCreatedCode(result.code ?? "");
    setNotice("Access code created. Copy it now.");
    event.currentTarget.reset();
    await onChange();
  }

  async function toggle(id: number, active: boolean) {
    if (preview) {
      setNotice("Preview mode: access-code changes are disabled.");
      return;
    }
    const response = await fetch("/api/admin/access-codes", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, active }),
    });
    setNotice(response.ok ? "Access code updated." : "Access code could not be updated.");
    if (response.ok) await onChange();
  }

  async function remove(id: number, label: string) {
    if (preview) {
      setNotice("Preview mode: access-code deletion is disabled.");
      return;
    }
    if (!window.confirm(`Permanently delete the access code for “${label}”?`)) {
      return;
    }
    const response = await fetch(
      `/api/admin/content?kind=access-code&id=${id}`,
      { method: "DELETE" },
    );
    setNotice(
      response.ok
        ? "Access code deleted."
        : "Access code could not be deleted.",
    );
    if (response.ok) await onChange();
  }

  return (
    <div className="access-manager">
      <form className="access-create" onSubmit={create}>
        <span>REVIEWER ACCESS</span>
        <h2>Create authorization code</h2>
        <p className="access-guidance">
          Create one code per reviewer. The readable code is displayed once
          and is never stored in the database.
        </p>
        <Field label="Reviewer or purpose" name="label" value="" uncontrolled />
        <div className="admin-field-grid">
          <label>
            Access scope
            <select defaultValue="private_basic" name="scope">
              <option value="private_basic">Basic private materials</option>
              <option value="private_research">Unpublished research</option>
              <option value="private_academic">Academic documents</option>
              <option value="private_full">Full access</option>
            </select>
          </label>
          <label>
            File permission mode
            <select
              name="grantMode"
              onChange={(event) =>
                setGrantMode(
                  event.target.value === "scope" ? "scope" : "selected",
                )
              }
              value={grantMode}
            >
              <option value="selected">Only selected files</option>
              <option value="scope">All compatible files in this scope</option>
            </select>
          </label>
          <Field label="Maximum successful logins" name="maxUses" type="number" value="" uncontrolled />
          <Field label="Session duration in hours" name="sessionHours" type="number" value="24" uncontrolled />
          <Field label="Expiration" name="expiresAt" type="datetime-local" value="" uncontrolled />
        </div>
        {grantMode === "selected" && (
          <fieldset className="private-file-picker">
            <legend>Files available to this reviewer</legend>
            {privateFiles.length ? (
              privateFiles.map((file) => (
                <label key={String(file.id)}>
                  <input name="fileIds" type="checkbox" value={String(file.id)} />
                  <span>
                    <strong>{String(file.title || file.name)}</strong>
                    <small>
                      {String(file.required_scope)} · {String(file.category)}
                    </small>
                  </span>
                </label>
              ))
            ) : (
              <p>
                Upload at least one file with Private visibility before
                generating a file-specific code.
              </p>
            )}
          </fieldset>
        )}
        <button
          className="admin-save"
          disabled={grantMode === "selected" && !privateFiles.length}
          type="submit"
        >
          Generate secure code
        </button>
        {createdCode && (
          <div className="created-code">
            <span>COPY THIS CODE NOW</span>
            <strong>{createdCode}</strong>
            <button onClick={() => navigator.clipboard.writeText(createdCode)} type="button">Copy</button>
          </div>
        )}
      </form>
      <section className="access-list">
        <header><span>ACTIVE & PAST CODES</span><strong>{data.accessCodes.length}</strong></header>
        {data.accessCodes.map((code) => (
          <article key={String(code.id)}>
            <div>
              <span>
                {Boolean(code.active) ? "ACTIVE" : "REVOKED"} · {String(code.scope)}
              </span>
              <h3>{String(code.label)}</h3>
              <small>
                Successful logins: {String(code.use_count)}
                {code.max_uses ? ` / ${String(code.max_uses)}` : " / unlimited"}
                {" · Downloads: "}
                {String(code.download_count ?? 0)}
                {" · Session: "}
                {String(code.session_hours ?? 24)}h
              </small>
              <small>
                {code.expires_at
                  ? `Expires ${String(code.expires_at)} UTC`
                  : "No expiration"}
                {code.last_used_at
                  ? ` · Last used ${String(code.last_used_at)} UTC`
                  : " · Never used"}
              </small>
              <div className="access-file-summary">
                {String(code.grant_mode) === "scope" ? (
                  <span>All compatible files in this scope</span>
                ) : Number(code.file_count ?? 0) ? (
                  String(code.file_titles)
                    .split(",")
                    .filter(Boolean)
                    .map((title) => <span key={title}>{title}</span>)
                ) : (
                  <span>No files assigned</span>
                )}
              </div>
            </div>
            <aside>
              <button onClick={() => toggle(Number(code.id), !Boolean(code.active))}>
                {Boolean(code.active) ? "Revoke" : "Reactivate"}
              </button>
              <button
                className="danger"
                onClick={() => remove(Number(code.id), String(code.label))}
              >
                Delete
              </button>
            </aside>
          </article>
        ))}
      </section>
      <section className="access-activity">
        <header>
          <span>RECENT ACCESS ACTIVITY</span>
          <strong>{data.accessLogs.length}</strong>
        </header>
        {data.accessLogs.length ? (
          data.accessLogs.slice(0, 20).map((log) => (
            <article key={String(log.id)}>
              <span>{String(log.action).replaceAll("_", " ")}</span>
              <div>
                <strong>{String(log.label || "Unknown reviewer")}</strong>
                <small>
                  {String(log.file_title || log.detail || "Private access")}
                  {" · "}
                  {String(log.created_at)}
                </small>
              </div>
            </article>
          ))
        ) : (
          <p>No private access activity has been recorded yet.</p>
        )}
      </section>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  area = false,
  type = "text",
  name,
  uncontrolled = false,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  area?: boolean;
  type?: string;
  name?: string;
  uncontrolled?: boolean;
}) {
  const common = {
    name,
    placeholder: label,
    ...(uncontrolled
      ? { defaultValue: value }
      : { value, onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange?.(event.target.value) }),
  };
  return (
    <label>
      {label}
      {area ? <textarea rows={4} {...common} /> : <input type={type} {...common} />}
    </label>
  );
}
