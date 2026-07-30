import { notFound } from "next/navigation";
import {
  AdminDashboard,
  type AdminData,
} from "@/app/admin/admin-dashboard";
import {
  getContentItems,
  getSiteSettings,
} from "@/lib/site-data";

export const dynamic = "force-dynamic";

export default async function AdminPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const [settings, projects, coursework, publications] = await Promise.all([
    getSiteSettings(),
    getContentItems("project", true),
    getContentItems("coursework", true),
    getContentItems("publication", true),
  ]);

  const data: AdminData = {
    settings: JSON.parse(JSON.stringify(settings)) as AdminData["settings"],
    content: { projects, coursework, publications },
    files: [
      {
        id: 1,
        key: "preview-robot-factory.jpg",
        name: "robot-factory.jpg",
        title: "Industrial robot research cover",
        content_type: "image/jpeg",
        size: 284000,
        visibility: "public",
        category: "project-images",
        required_scope: "private_basic",
        preview_url: "/media/robot-factory.jpg",
      },
      {
        id: 2,
        key: "preview-cv.pdf",
        name: "changyuan-xin-cv.pdf",
        title: "Academic CV",
        content_type: "application/pdf",
        size: 816000,
        visibility: "public",
        category: "cv",
        required_scope: "private_basic",
        preview_url: "#",
      },
      {
        id: 3,
        key: "preview-transcript.pdf",
        name: "academic-transcript.pdf",
        title: "Academic transcript",
        content_type: "application/pdf",
        size: 1290000,
        visibility: "private",
        category: "academic-documents",
        required_scope: "private_academic",
        preview_url: "#",
      },
    ],
    accessCodes: [
      {
        id: 1,
        label: "Prospective supervisor review",
        scope: "private_research",
        use_count: 1,
        max_uses: 5,
        active: 1,
        expires_at: "2026-11-30",
      },
      {
        id: 2,
        label: "Application committee",
        scope: "private_academic",
        use_count: 0,
        max_uses: 3,
        active: 1,
        expires_at: "2026-12-31",
      },
    ],
  };

  return (
    <AdminDashboard
      initialData={data}
      preview
      user={{
        ok: true,
        email: "preview@xcy-robotics.local",
        displayName: "Changyuan Xin",
      }}
    />
  );
}
