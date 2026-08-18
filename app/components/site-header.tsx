import Link from "next/link";

const navigation = [
  ["Home", "/"],
  ["Research", "/research"],
  ["Coursework", "/coursework"],
  ["Publications", "/publications"],
  ["CV", "/cv"],
  ["Textbook", "/textbook"],
  ["Resources", "/resources"],
] as const;

export function SiteHeader({ active = "" }: { active?: string }) {
  return (
    <header className="topbar">
      <Link className="logo" href="/" aria-label="XCY Robotics homepage">
        <span className="logo-cube"><i /></span>
        <span>
          <strong>XCY ROBOTICS</strong>
          <small>INTELLIGENCE IN MOTION</small>
        </span>
      </Link>

      <nav aria-label="Primary navigation">
        {navigation.map(([label, href]) => (
          <Link
            className={active === label.toLowerCase() ? "active" : ""}
            href={href}
            key={href}
          >
            {label}
          </Link>
        ))}
      </nav>

      <Link className="header-contact" href="/#contact">
        Let&apos;s connect <span>↗</span>
      </Link>

      <details className="mobile-nav">
        <summary aria-label="Open navigation">Menu</summary>
        <div>
          {navigation.map(([label, href]) => (
            <Link href={href} key={href}>{label}</Link>
          ))}
        </div>
      </details>
    </header>
  );
}
