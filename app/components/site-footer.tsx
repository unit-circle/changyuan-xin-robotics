import Link from "next/link";
import type { SiteSettings } from "@/lib/site-data";

export function SiteFooter({
  settings,
  profile,
}: {
  settings?: SiteSettings;
  profile?: SiteSettings["profile"];
}) {
  const currentProfile = profile ?? settings?.profile;
  if (!currentProfile) return null;

  return (
    <footer id="contact">
      <div className="footer-brand">
        <span className="section-eyebrow">CONTACT</span>
        <strong>{currentProfile.name} · {currentProfile.chineseName}</strong>
        <p>Robotics & Intelligent Manufacturing Portfolio</p>
      </div>
      <div className="footer-links">
        <a href={`mailto:${currentProfile.email}`}>Email ↗</a>
        <Link href="/research">Research</Link>
        <Link href="/cv">CV</Link>
        <Link className="private-link" href="/private">Private Materials</Link>
      </div>
    </footer>
  );
}
