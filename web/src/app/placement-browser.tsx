"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Placement, PlacementList } from "@/lib/placement-types";
type Props = {
  compact?: boolean;
  savedOnly?: boolean;
  saved: string[];
  onSave: (id: string) => void;
};
const tones: Record<string, string> = {
  Design: "lavender",
  Engineering: "blue",
  Marketing: "cream",
  Data: "green",
};
export default function PlacementBrowser({
  compact = false,
  savedOnly = false,
  saved,
  onSave,
}: Props) {
  const [query, setQuery] = useState(""),
    [location, setLocation] = useState(""),
    [category, setCategory] = useState(""),
    [mode, setMode] = useState("");
  const [page, setPage] = useState(1),
    [data, setData] = useState<PlacementList | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0);
  const savedKey = saved.join(",");
  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(
      async () => {
        setLoading(true);
        setError("");
        try {
          const read = async (url: string) => {
            const r = await fetch(url, {
              signal: controller.signal,
              cache: "no-store",
            });
            const body = await r.json();
            if (r.status === 404 && savedOnly) return null;
            if (!r.ok)
              throw new Error(
                body.error?.message || "Unable to load opportunities.",
              );
            return body;
          };
          if (savedOnly) {
            const ids = savedKey.split(",").filter(Boolean);
            const results = await Promise.all(
              ids.map((id) =>
                read((id.startsWith("jobboard-") ? "/api/jobs/" : "/api/placements/") + encodeURIComponent(id)),
              ),
            );
            const items: Placement[] = results
              .filter(Boolean)
              .map((r) => r.data);
            if (!controller.signal.aborted)
              setData({
                success: true,
                data: items,
                pagination: {
                  page: 1,
                  limit: 50,
                  total: items.length,
                  total_pages: items.length ? 1 : 0,
                  has_next: false,
                },
                meta: {
                  api_version: "1.0",
                  request_id: "",
                  timestamp: "",
                  data_source: "database",
                },
              });
          } else {
            const params = new URLSearchParams({
              page: String(page),
              limit: compact ? "3" : "6",
              status: "open",
            });
            if (query.trim()) params.set("q", query.trim());
            if (location.trim()) params.set("location", location.trim());
            if (category) params.set("category", category);
            if (mode) params.set("work_mode", mode);
            const result = await read("/api/jobs?" + params);
            if (!controller.signal.aborted) setData(result);
          }
        } catch (e) {
          if (!controller.signal.aborted) {
            setData(null);
            setError(
              e instanceof Error ? e.message : "Unable to load opportunities.",
            );
          }
        } finally {
          if (!controller.signal.aborted) setLoading(false);
        }
      },
      query || location ? 250 : 0,
    );
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [
    query,
    location,
    category,
    mode,
    page,
    compact,
    savedOnly,
    savedOnly ? savedKey : "",
    retry,
  ]);
  function filter(change: () => void) {
    change();
    setPage(1);
    setLoading(true);
  }
  return (
    <div className="placement-browser">
      {!compact && !savedOnly && (
        <div className="filter-bar placement-filters">
          <label className="search-field">
            <span aria-hidden="true">⌕</span>
            <input
              aria-label="Search opportunities"
              placeholder="Search roles, companies, or skills…"
              maxLength={100}
              value={query}
              onChange={(e) => filter(() => setQuery(e.target.value))}
            />
          </label>
          <input
            className="location-filter"
            aria-label="Filter by location"
            placeholder="Location"
            maxLength={100}
            value={location}
            onChange={(e) => filter(() => setLocation(e.target.value))}
          />
          <select
            aria-label="Category"
            value={category}
            onChange={(e) => filter(() => setCategory(e.target.value))}
          >
            <option value="">All opportunities</option>
            {(data?.meta.categories || []).map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select
            aria-label="Work arrangement"
            value={mode}
            onChange={(e) => filter(() => setMode(e.target.value))}
          >
            <option value="">All arrangements</option>
            <option value="remote">Remote</option>
            <option value="unspecified">Not specified</option>
          </select>
        </div>
      )}
      <div className="results-heading">
        <span aria-live="polite">
          {loading
            ? "Loading opportunities…"
            : error
              ? "Connection unavailable"
              : `${data?.pagination.total ?? 0} ${savedOnly ? "saved opportunities" : "open opportunities"}`}
        </span>
        <span>Team 18 Job Board · Fictional demo listings</span>
      </div>
      {loading ? (
        <div
          className="job-grid"
          aria-label="Loading opportunities"
          aria-busy="true"
        >
          {Array.from({ length: compact ? 3 : 6 }, (_, i) => (
            <div className="job-card catalogue-skeleton" key={i}>
              <div />
              <div />
              <div />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="empty" role="alert">
          <h3>A little connection trouble.</h3>
          <p>{error}</p>
          <button
            className="primary"
            onClick={() => {
              setLoading(true);
              setRetry((n) => n + 1);
            }}
          >
            Try again
          </button>
        </div>
      ) : !data?.data.length ? (
        <div className="empty">
          <h3>
            {savedOnly
              ? "Keep a good possibility close."
              : "No opportunities found."}
          </h3>
          <p>
            {savedOnly
              ? "Save opportunities from the catalogue. Expired and unavailable listings are automatically hidden."
              : "Try another keyword or location, or clear your filters."}
          </p>
          {savedOnly ? (
            <Link href="/?view=Opportunities" className="secondary">
              Browse opportunities
            </Link>
          ) : (
            !compact && (
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
            )
          )}
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
                <button
                  className={`save-button ${saved.includes(p.id) ? "is-saved" : ""}`}
                  aria-label={`${saved.includes(p.id) ? "Unsave" : "Save"} ${p.title}`}
                  aria-pressed={saved.includes(p.id)}
                  onClick={() => onSave(p.id)}
                >
                  {saved.includes(p.id) ? "◆" : "◇"}
                </button>
              </div>
              <p className="company-name">
                {p.company}
                <span> · {p.category}</span>
              </p>
              <Link className="job-title" href={"/opportunities/" + p.id}>
                {p.title}
              </Link>
              <p className="location">
                {p.location} · {p.work_mode === "unspecified" ? "Arrangement not specified" : p.work_mode}
              </p>
              <div className="tags">
                {p.skills.map((s) => (
                  <span key={s}>{s}</span>
                ))}
                {p.is_demo && <span className="demo-record">Demo record</span>}
              </div>
              <p className="deadline">
                {p.application_deadline ? "Apply by " : "Deadline not specified"}
                {p.application_deadline && new Date(
                  p.application_deadline + "T12:00:00",
                ).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
              <div className="job-card-bottom">
                <span>
                  {p.salary_text || (p.allowance_thb === null
                    ? "Allowance not specified"
                    : `฿${p.allowance_thb.toLocaleString()} / month`)}
                </span>
                <Link
                  href={"/opportunities/" + p.id}
                  aria-label={"View " + p.title}
                >
                  View ↗
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
      {!compact &&
        !savedOnly &&
        data &&
        !error &&
        !loading &&
        data.pagination.total_pages > 1 && (
          <div className="catalogue-pagination">
            <button
              className="secondary"
              disabled={page === 1}
              onClick={() => {
                setLoading(true);
                setPage((p) => p - 1);
              }}
            >
              ← Previous
            </button>
            <span>
              Page {page} of {data.pagination.total_pages}
            </span>
            <button
              className="secondary"
              disabled={!data.pagination.has_next}
              onClick={() => {
                setLoading(true);
                setPage((p) => p + 1);
              }}
            >
              Next →
            </button>
          </div>
        )}
    </div>
  );
}
