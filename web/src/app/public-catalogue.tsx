"use client";
import Link from "next/link";
import PlacementBrowser from "./placement-browser";
export default function PublicCatalogue() {
  return (
    <div className="portal-shell">
      <aside className="portal-sidebar">
        <Link href="/" className="auth-brand">
          internly<span>.</span>
        </Link>
        <p className="eyebrow">YOUR NEXT CHAPTER</p>
        <nav aria-label="Main navigation">
          <Link className="catalogue-nav-active" href="/">
            Opportunities <span>↗</span>
          </Link>
        </nav>
        <div className="portal-profile">
          <strong>A little direction.</strong>
          <small>A world of possibility.</small>
          <Link className="primary" href="/sign-in">
            Sign in →
          </Link>
        </div>
      </aside>
      <main className="portal-main">
        <header className="portal-header">
          <div>
            <span className="eyebrow">FIND YOUR NEXT STEP</span>
            <h1>Curiosity meets opportunity.</h1>
            <p className="muted">
              Explore internships, find your fit, and sign in to start your
              application.
            </p>
          </div>
          <Link className="secondary" href="/sign-in">
            Student / Advisor login
          </Link>
        </header>
        <PlacementBrowser />
      </main>
    </div>
  );
}
