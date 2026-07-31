import Link from "next/link";
import { SiteHeader } from "@/app/components/site-header";

export default function NotFound() {
  return (
    <main className="site-shell">
      <SiteHeader />
      <section className="not-found-page">
        <div>
          <span>404 / UNMAPPED COORDINATE</span>
          <h1>
            This page has
            <em>not been mapped yet.</em>
          </h1>
          <p>
            The requested research coordinate does not exist or may have moved.
            Return to the portfolio or continue exploring the current work.
          </p>
          <div className="not-found-actions">
            <Link className="button-primary" href="/">
              Return home
            </Link>
            <Link className="button-secondary" href="/research">
              Explore research
            </Link>
          </div>
        </div>
        <figure>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt="Industrial robotics research environment"
            src="/media/robotics.jpg"
          />
          <figcaption>ROBOTICS · CONTROL · INTELLIGENCE</figcaption>
        </figure>
      </section>
    </main>
  );
}
