import Link from "next/link";

export function PageHero({
  eyebrow,
  title,
  accent,
  description,
  image,
  index,
  actions,
}: {
  eyebrow: string;
  title: string;
  accent?: string;
  description: string;
  image: string;
  index: string;
  actions?: Array<{ label: string; href: string }>;
}) {
  return (
    <section className="page-hero">
      <div className="page-hero-copy">
        <span className="section-eyebrow">{eyebrow}</span>
        <h1>
          {title}
          {accent && <em>{accent}</em>}
        </h1>
        <p>{description}</p>
        {actions && (
          <div className="page-actions">
            {actions.map((action, actionIndex) => (
              <Link
                className={actionIndex === 0 ? "button-primary" : "button-secondary"}
                href={action.href}
                key={action.href}
              >
                {action.label} <span>↗</span>
              </Link>
            ))}
          </div>
        )}
      </div>
      <figure className="page-hero-media">
        {/* External and generated source ratios are preserved by the media frame. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt="" />
        <figcaption>{index}</figcaption>
      </figure>
    </section>
  );
}
