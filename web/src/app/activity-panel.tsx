"use client";
import { useState } from "react";
type Row = {
  id: string | number;
  type?: string;
  state?: string;
  source?: string;
  verified?: boolean;
  action?: string;
  created_at: string;
};
type Activity = {
  counts: { kind: string; count: number }[];
  events: Row[];
  receipts: Row[];
  logs: Row[];
  fetched_at: string;
};
export default function ActivityPanel() {
  const [token, setToken] = useState("");
  const [data, setData] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/integration/activity", {
        headers: { Authorization: "Bearer " + token.trim() },
        cache: "no-store",
      });
      const result = await response.json();
      if (!response.ok) {
        setData(null);
        throw new Error(result.error?.message ?? "Unable to load activity.");
      }
      setData(result);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to connect. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }
  return (
    <>
      <section className="report-banner">
        <div>
          <span className="eyebrow">CONNECTED TO SUPABASE</span>
          <h2>A clear view of your integrations.</h2>
          <p>Read-only activity from your real A5 database.</p>
        </div>
        {data && (
          <button
            className="secondary"
            onClick={() => {
              setData(null);
              setToken("");
            }}
            disabled={loading}
          >
            Lock activity
          </button>
        )}
      </section>
      {!data && (
        <section className="full-panel">
          <form
            className="activity-auth"
            onSubmit={(e) => {
              e.preventDefault();
              void load();
            }}
          >
            <h2>Operator access</h2>
            <p className="demo-note">
              Use INTEGRATION_ADMIN_TOKEN from your local .env.local file. This
              is a separate operator token, not your database password. It is
              kept in memory for this view.
            </p>
            <label htmlFor="operator-token" className="form-label">
              Operator token
            </label>
            <input
              id="operator-token"
              type="password"
              autoComplete="off"
              required
              minLength={32}
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
            <button className="primary" disabled={loading}>
              {loading ? "Connecting…" : "View database activity"}
            </button>
            {error && (
              <p role="alert" className="connection-error">
                {error}
              </p>
            )}
          </form>
        </section>
      )}
      {data && (
        <>
          <div className="section-heading" style={{ marginTop: 28 }}>
            <p>
              Updated {new Date(data.fetched_at).toLocaleString()} · Latest 30
              records per table
            </p>
            <button
              className="text-button"
              disabled={loading}
              onClick={() => void load()}
            >
              {loading ? "Refreshing…" : "Refresh activity ↻"}
            </button>
          </div>
          {error && (
            <p role="alert" className="connection-error">
              {error} Displayed data is from the previous refresh.
            </p>
          )}
          <div className="stats activity-stats">
            {data.counts.map((c) => (
              <div key={c.kind} className="stat">
                <div>
                  <span className="stat-label">
                    {c.kind === "events"
                      ? "Status events"
                      : c.kind === "receipts"
                        ? "Webhook receipts"
                        : "Integration logs"}
                  </span>
                  <strong>{String(c.count).padStart(2, "0")}</strong>
                  <small>Stored in Supabase</small>
                </div>
                <span className="stat-icon sage">↗</span>
              </div>
            ))}
          </div>
          {(
            [
              ["Status events", data.events],
              ["Webhook receipts", data.receipts],
              ["Integration logs", data.logs],
            ] as [string, Row[]][]
          ).map(([title, rows]) => (
            <section key={title} className="full-panel activity-panel">
              <div className="section-heading">
                <h2>{title}</h2>
                <span className="count-pill">Live records</span>
              </div>
              {rows.length ? (
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>RECORD</th>
                        <th>DETAILS</th>
                        <th>RECORDED AT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr key={row.id}>
                          <td title={String(row.id)}>
                            {row.type ?? row.action}
                          </td>
                          <td>
                            {row.state ??
                              (row.source
                                ? `${row.source} · ${row.verified ? "Verified" : "Unverified"}`
                                : "Recorded")}
                          </td>
                          <td>{new Date(row.created_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty">
                  <h3>No records yet.</h3>
                  <p>
                    New integration activity will appear here after a refresh.
                  </p>
                </div>
              )}
            </section>
          ))}
        </>
      )}
    </>
  );
}
