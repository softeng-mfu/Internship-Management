"use client";
import { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
export default function SignInPage() {
  const [mode, setMode] = useState<"student" | "advisor">("student"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [register, setRegister] = useState(false);
  return (
    <main className="auth-screen">
      <Link href="/" className="auth-brand">
        internly<span>.</span>
      </Link>
      <section className="auth-card">
        <span className="eyebrow">YOUR NEXT CHAPTER</span>
        <h1>
          {mode === "student"
            ? "Your next step starts here."
            : register
              ? "Start guiding students."
              : "Guide the next generation."}
        </h1>
        <div className="login-options" aria-label="Login type">
          {(["student", "advisor"] as const).map((type) => (
            <button
              key={type}
              type="button"
              aria-pressed={mode === type}
              disabled={busy}
              onClick={() => {
                setMode(type);
                setRegister(false);
                setError("");
              }}
            >
              {type === "student" ? "Student login" : "Advisor login"}
            </button>
          ))}
        </div>
        <p className="muted">
          {mode === "student"
            ? "Use your campus Student Identity account."
            : register
              ? "Create your advisor account to open your workspace."
              : "Sign in to your advisor workspace."}
        </p>
        <form
          key={`${mode}-${register}`}
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            const form = new FormData(e.currentTarget);
            try {
              if (mode === "student") {
                const response = await fetch(
                  "/api/auth/sign-in/student-identity",
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      studentId: String(form.get("studentId") || "").trim(),
                      password: String(form.get("password") || ""),
                    }),
                    signal: AbortSignal.timeout(25000),
                  },
                );
                const body = await response.json();
                if (!response.ok)
                  throw new Error(
                    body.message ||
                      body.error?.message ||
                      "Student sign-in failed.",
                  );
                const requested = new URLSearchParams(
                  window.location.search,
                ).get("next");
                const target = new URL(
                  requested || "/workspace",
                  window.location.origin,
                );
                window.location.assign(
                  target.origin === window.location.origin &&
                    target.pathname === "/workspace"
                    ? target.pathname + target.search
                    : "/workspace",
                );
              } else if (register) {
                const password = String(form.get("password") || "");
                if (password !== String(form.get("confirmPassword") || ""))
                  throw new Error("Passwords do not match.");
                const response = await fetch("/api/auth/sign-up/advisor", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    name: String(form.get("name") || "").trim(),
                    email: String(form.get("email") || "").trim(),
                    password,
                  }),
                  signal: AbortSignal.timeout(25000),
                });
                const body = await response.json();
                if (!response.ok)
                  throw new Error(
                    body.message ||
                      body.error?.message ||
                      "Unable to create your account.",
                  );
                window.location.assign("/advisor");
              } else {
                const result = await authClient.signIn.email({
                  email: String(form.get("email") || "").trim(),
                  password: String(form.get("password") || ""),
                });
                if (result.error)
                  throw new Error(result.error.message || "Unable to sign in.");
                const session = await authClient.getSession();
                if (
                  !session.data ||
                  !["advisor", "admin"].includes(session.data.user.role)
                ) {
                  await authClient.signOut();
                  throw new Error(
                    "Use Student login for your student account.",
                  );
                }
                window.location.assign("/advisor");
              }
            } catch (e) {
              setError(e instanceof Error ? e.message : "Unable to connect.");
            } finally {
              setBusy(false);
            }
          }}
        >
          {mode === "advisor" && register && (
            <label className="form-label">
              Full name
              <input
                name="name"
                autoComplete="name"
                required
                minLength={2}
                maxLength={100}
                disabled={busy}
              />
            </label>
          )}
          {mode === "student" ? (
            <label className="form-label">
              Student ID
              <input
                name="studentId"
                inputMode="numeric"
                pattern="[0-9]{10}"
                maxLength={10}
                autoComplete="username"
                required
                disabled={busy}
              />
            </label>
          ) : (
            <label className="form-label">
              Advisor email
              <input
                name="email"
                type="email"
                autoComplete="username"
                required
                disabled={busy}
              />
            </label>
          )}
          <label className="form-label">
            Password
            <input
              name="password"
              type="password"
              autoComplete={register ? "new-password" : "current-password"}
              minLength={mode === "advisor" && register ? 12 : undefined}
              required
              maxLength={128}
              disabled={busy}
            />
          </label>
          {mode === "advisor" && register && (
            <>
              <label className="form-label">
                Confirm password
                <input
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={12}
                  maxLength={128}
                  disabled={busy}
                />
              </label>
              <small className="muted">
                Use at least 12 characters. You will see student records only
                after an administrator assigns students to you.
              </small>
            </>
          )}
          {error && (
            <p className="connection-error" role="alert">
              {error}
            </p>
          )}
          <button className="primary" disabled={busy}>
            {busy
              ? register
                ? "Creating account…"
                : "Signing in…"
              : mode === "student"
                ? "Continue with Student Identity →"
                : register
                  ? "Create advisor account →"
                  : "Open advisor workspace →"}
          </button>
        </form>
        {mode === "student" ? (
          <p className="auth-footnote">
            New student?{" "}
            <a
              href="https://student-identity.onrender.com/#/signup"
              target="_blank"
              rel="noopener noreferrer"
            >
              Create your campus identity ↗
            </a>
            <br />
            Your password is sent securely to Student Identity and is not saved
            by Internly. Student sessions last up to 15 minutes.
          </p>
        ) : (
          <>
            <p>
              {register ? "Already have an advisor account?" : "New advisor?"}{" "}
              <button
                type="button"
                className="text-button"
                disabled={busy}
                onClick={() => {
                  setRegister(!register);
                  setError("");
                }}
              >
                {register ? "Sign in" : "Create advisor account"}
              </button>
            </p>
            <p className="auth-footnote">
              Student assignments are managed by the Internship team. Creating
              an account does not verify staff status or provide access to
              student records.
            </p>
          </>
        )}
      </section>
      <Link href="/">← Browse opportunities</Link>
    </main>
  );
}
