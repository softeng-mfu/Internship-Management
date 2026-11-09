"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Placement, PlacementList } from "@/lib/placement-types";
type Props = { compact?: boolean; onApply?: (placement: Placement) => void };
const tones: Record<string, string> = {
  Design: "lavender",
  Engineering: "blue",
  Marketing: "cream",
  Data: "green",
};
export default function PlacementBrowser({ compact = false, onApply }: Props) {
  const [query, setQuery] = useState(""),
    [location, setLocation] = useState(""),
    [category, setCategory] = useState(""),
    [mode, setMode] = useState(""),
    [page, setPage] = useState(1);
  const [data, setData] = useState<PlacementList | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    const timer = setTimeout(
      async () => {
        try {
          const params = new URLSearchParams({
            page: String(page),
            limit: compact ? "3" : "6",
            status: "open",
          });
          if (query.trim()) params.set("q", query.trim());
          if (location.trim()) params.set("location", location.trim());
          if (category) params.set("category", category);
          if (mode) params.set("work_mode", mode);
          const response = await fetch("/api/placements?" + params, {
            signal: controller.signal,
            cache: "no-store",
          });
          const body = await response.json();
          if (!response.ok)
            throw new Error(
              body.error?.message || "Unable to load opportunities.",
            );
          if (!controller.signal.aborted) setData(body);
        } catch (e) {
          if (!controller.signal.aborted)
            setError(e instanceof Error ? e.message : "Unable to connect.");
        } finally {
          if (!controller.signal.aborted) setLoading(false);
        }
      },
      query || location ? 250 : 0,
    );
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, location, category, mode, page, compact, retry]);
  function filter(change: () => void) {
    setPage(1);
    change();
  }
  return (
    <section aria-label="Internship opportunities">
      {!compact && (
        <div className="catalogue-filters">
          <label>
            Search internships
            <input
              placeholder="Role, company or skill"
              value={query}
              onChange={(e) => filter(() => setQuery(e.target.value))}
            />
          </label>
          <label>
            Location
            <input
              placeholder="City or remote"
              value={location}
              onChange={(e) => filter(() => setLocation(e.target.value))}
            />
          </label>
          <label>
            Category
            <select
              value={category}
              onChange={(e) => filter(() => setCategory(e.target.value))}
            >
              <option value="">All categories</option>
              {Object.keys(tones).map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            Work arrangement
            <select
              value={mode}
              onChange={(e) => filter(() => setMode(e.target.value))}
            >
              <option value="">All arrangements</option>
              <option value="on-site">On-site</option>
              <option value="hybrid">Hybrid</option>
              <option value="remote">Remote</option>
            </select>
          </label>
        </div>
      )}
      <div className="section-heading">
        <p className="muted" role="status">
          {loading
            ? "Finding opportunities…"
            : `${data?.pagination.total || 0} open opportunities`}
        </p>
        {!compact && <span className="count-pill">Internship catalogue</span>}
      </div>
      {error ? (
        <div className="full-panel empty" role="alert">
          <h3>We couldn’t load opportunities.</h3>
          <p>{error}</p>
          <button className="secondary" onClick={() => setRetry((v) => v + 1)}>
            Try again
          </button>
        </div>
      ) : loading ? (
        <div className="full-panel empty">Loading opportunities…</div>
      ) : !data?.data.length ? (
        <div className="full-panel empty">
          <h3>No matches yet.</h3>
          <p>Try another keyword or clear your filters.</p>
          <button
            className="secondary"
            onClick={() =>
              filter(() => {
                setQuery("");
                setLocation("");
                setCategory("");
                setMode("");
              })
            }
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="job-grid listing-grid">
          {data.data.map((p) => (
            <article className="job-card" key={p.id}>
              <div className="job-card-top">
                <span
                  className={`company-logo ${tones[p.category] || "cream"}`}
                >
                  {p.company.charAt(0)}
                </span>
                {p.is_demo && (
                  <span className="demo-record">Sample listing</span>
                )}
              </div>
              <p className="company-name">
                {p.company}
                <span> · {p.category}</span>
              </p>
              <Link className="job-title" href={"/opportunities/" + p.id}>
                {p.title}
              </Link>
              <p className="location">
                {p.location} · {p.work_mode}
              </p>
              <div className="tags">
                {p.skills.map((skill) => (
                  <span key={skill}>{skill}</span>
                ))}
              </div>
              <p className="deadline">
                Apply by{" "}
                {new Date(
                  p.application_deadline + "T12:00:00",
                ).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
              <div className="job-card-bottom">
                <span>
                  {p.allowance_thb === null
                    ? "Allowance not specified"
                    : `฿${p.allowance_thb.toLocaleString()} / month`}
                </span>
                {onApply ? (
                  <button className="text-button" onClick={() => onApply(p)}>
                    Apply →
                  </button>
                ) : (
                  <Link href={"/opportunities/" + p.id}>View ↗</Link>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
      {!compact &&
        data &&
        !error &&
        !loading &&
        data.pagination.total_pages > 1 && (
          <div className="catalogue-pagination">
            <button
              className="secondary"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              ← Previous
            </button>
            <span>
              Page {page} of {data.pagination.total_pages}
            </span>
            <button
              className="secondary"
              disabled={!data.pagination.has_next}
              onClick={() => setPage((p) => p + 1)}
            >
              Next →
            </button>
          </div>
        )}
    </section>
  );
}
