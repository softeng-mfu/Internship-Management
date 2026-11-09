import { getJob } from "@/lib/job-board";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPlacement } from "@/lib/placements-service";
import { placementsDatabase } from "@/lib/placements-db";
import type { Placement } from "@/lib/placement-types";
export const dynamic = "force-dynamic";
export default async function Opportunity({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const origin = process.env.PUBLIC_SITE_URL || "http://127.0.0.1:3001";
  const request = new Request(
    new URL("/api/jobs/" + encodeURIComponent(id), origin),
  );
  const response = id.startsWith("jobboard-")
    ? await getJob(request, id)
    : await getPlacement(
        new Request(
          new URL("/api/placements/" + encodeURIComponent(id), origin),
        ),
        id,
        placementsDatabase,
      );
  if (response.status === 404 || response.status === 400) notFound();
  const body = await response.json();
  if (!response.ok)
    return (
      <main className="detail-page">
        <Link href="/?view=Opportunities" className="text-button">
          ← Back to opportunities
        </Link>
        <section className="full-panel empty" role="alert">
          <h1>We couldn’t load this opportunity.</h1>
          <p>Listings are temporarily unavailable. Please try again.</p>
          <a
            href={"/opportunities/" + encodeURIComponent(id)}
            className="primary"
          >
            Try again
          </a>
        </section>
      </main>
    );
  const p: Placement = body.data;
  return (
    <main className="detail-page">
      <header className="detail-topbar">
        <Link className="brand" href="/">
          internly<span className="brand-period">.</span>
        </Link>
        <Link href="/?view=Opportunities" className="text-button">
          ← All opportunities
        </Link>
      </header>
      <article className="opportunity-detail">
        <div className="eyebrow">YOUR NEXT CHAPTER</div>
        <div className="detail-status">
          <span className="status approved">
            <i />
            Open opportunity
          </span>
          {p.is_demo && (
            <span className="status under-review">
              <i />
              Demonstration record
            </span>
          )}
        </div>
        <h1>{p.title}</h1>
        <p className="detail-company">
          {p.company} · {p.location}
        </p>
        <div className="tags">
          {p.skills.map((s) => (
            <span key={s}>{s}</span>
          ))}
        </div>
        <div className="detail-facts">
          <div>
            <small>WORK ARRANGEMENT</small>
            <strong>
              {p.work_mode === "unspecified" ? "Not specified" : p.work_mode}
            </strong>
          </div>
          <div>
            <small>APPLICATION DEADLINE</small>
            <strong>
              {p.application_deadline
                ? new Date(
                    p.application_deadline + "T12:00:00",
                  ).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "Not specified"}
            </strong>
          </div>
          <div>
            <small>
              {p.source === "team18-job-board"
                ? "ALLOWANCE / SALARY"
                : "MONTHLY ALLOWANCE"}
            </small>
            <strong>
              {p.salary_text ||
                (p.allowance_thb === null
                  ? "Not specified"
                  : `฿${p.allowance_thb.toLocaleString()}`)}
            </strong>
          </div>
          <div>
            <small>DURATION</small>
            <strong>
              {p.duration_weeks === null
                ? "Not specified"
                : `${p.duration_weeks} weeks`}
            </strong>
          </div>
        </div>
        <h2>About the opportunity</h2>
        <p className="opportunity-description">{p.description}</p>
        {[
          ["Required skills", p.required_skills],
          ["Responsibilities", p.responsibilities],
          ["Qualifications", p.qualifications],
          ["Benefits", p.benefits],
        ].map(([heading, text]) =>
          text ? (
            <section key={heading}>
              <h2>{heading}</h2>
              <p className="opportunity-description">{text}</p>
            </section>
          ) : null,
        )}
        <aside className="demo-note">
          {p.is_demo
            ? "This is a fictional demonstration listing. It is not a real vacancy or company offer. "
            : ""}
          Sign in with your student identity to submit an application in
          Internly and follow its advisor review. This does not submit an
          application to the external Job Board.
        </aside>
        <div className="detail-actions">
          <Link
            href={`/workspace?tab=opportunities&apply=${p.id}`}
            className="primary"
          >
            Apply for this opportunity →
          </Link>
          <Link href="/?view=Opportunities" className="text-button">
            All opportunities →
          </Link>
        </div>
      </article>
    </main>
  );
}
