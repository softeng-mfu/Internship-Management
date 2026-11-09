import Link from "next/link";
export default function MissingOpportunity() {
  return (
    <main className="detail-page empty">
      <h1>This opportunity is no longer available.</h1>
      <p>It may be closed, expired, or unpublished.</p>
      <Link href="/?view=Opportunities" className="primary">
        Browse open opportunities
      </Link>
    </main>
  );
}
