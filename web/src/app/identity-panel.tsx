"use client";
import { useState } from "react";
type Claims = {
  studentId: string;
  service: string;
  issuedAt: string;
  claims: {
    verified: boolean;
    profileComplete: boolean;
    skills: string[];
    missingFields?: string[];
    name?: { first?: string; last?: string };
  };
};
export default function IdentityPanel() {
  const [student, setStudent] = useState(""),
    [data, setData] = useState<Claims | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <>
      <section className="report-banner">
        <div>
          <span className="eyebrow">STUDENT IDENTITY</span>
          <h2>A profile shared with permission.</h2>
          <p>
            Request consented identity claims through the campus Identity
            service.
          </p>
        </div>
        <a
          className="secondary"
          href="https://student-identity.onrender.com/#/consent"
          target="_blank"
          rel="noopener noreferrer"
        >
          Manage consent ↗
        </a>
      </section>
      <section className="full-panel">
        <h2>Shared student profile</h2>
        <p className="demo-note">
          View a profile shared through Student Identity. The student must
          enable profile:read sharing for our registered service before their
          details can be shown.
        </p>
        <form
          className="activity-auth"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            setData(null);
            try {
              const r = await fetch("/api/identity/claims", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ studentId: student }),
                signal: AbortSignal.timeout(15000),
              });
              const b = await r.json();
              if (!r.ok)
                throw new Error(b.error?.message || "Unable to read claims.");
              setData(b.data);
            } catch (e) {
              setError(
                e instanceof Error ? e.message : "Connection unavailable.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          <label className="form-label" htmlFor="identity-student">
            Student ID
          </label>
          <input
            id="identity-student"
            inputMode="numeric"
            disabled={busy}
            pattern="[0-9]{10}"
            maxLength={10}
            required
            value={student}
            onChange={(e) => {
              setData(null);
              setStudent(e.target.value);
            }}
          />
          <button className="primary" disabled={busy}>
            {busy ? "Checking consent…" : "Request shared profile"}
          </button>
          <button
            type="button"
            disabled={busy}
            className="text-button"
            onClick={() => {
              setStudent("");
              setData(null);
              setError("");
            }}
          >
            Clear private data
          </button>
        </form>
        {error && (
          <p className="connection-error" role="alert">
            {error}
          </p>
        )}
        {data && (
          <section aria-live="polite">
            <h3>
              {[data.claims.name?.first, data.claims.name?.last]
                .filter(Boolean)
                .join(" ") || "Shared student profile"}
            </h3>
            <p className="muted">
              {data.studentId} · Service {data.service}
            </p>
            <div className="detail-facts">
              <div>
                <small>VERIFIED</small>
                <strong>{data.claims.verified ? "Yes" : "No"}</strong>
              </div>
              <div>
                <small>PROFILE COMPLETE</small>
                <strong>{data.claims.profileComplete ? "Yes" : "No"}</strong>
              </div>
            </div>
            <div className="tags">
              {data.claims.skills.map((s) => (
                <span key={s}>{s}</span>
              ))}
            </div>
            <p className="muted">
              Issued {new Date(data.issuedAt).toLocaleString()}
            </p>
            <p className="demo-note">
              Claims are displayed in memory only and are not saved to the
              application database or browser storage.
            </p>
          </section>
        )}
      </section>
    </>
  );
}
