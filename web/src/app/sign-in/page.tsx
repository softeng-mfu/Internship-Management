"use client";
import { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export default function SignInPage() {
  const [register, setRegister] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return <main className="auth-screen">
    <Link href="/" className="auth-brand">internly<span>.</span></Link>
    <section className="auth-card">
      <span className="eyebrow">YOUR NEXT CHAPTER</span>
      <h1>{register ? "A place to begin." : "Welcome back."}</h1>
      <p className="muted">{register ? "Create your Internship workspace." : "Sign in to your Internship workspace."}</p>
      <form onSubmit={async e => {
        e.preventDefault(); setBusy(true); setError("");
        const form = new FormData(e.currentTarget);
        const email = String(form.get("email") || "").trim();
        const password = String(form.get("password") || "");
        try {
          const result = register
            ? await authClient.signUp.email({ email, password, name: String(form.get("name") || "").trim() })
            : await authClient.signIn.email({ email, password });
          if (result.error) setError(result.error.message || "Unable to sign in. Please try again.");
          else window.location.assign("/");
        } catch { setError("Unable to connect. Please try again."); }
        finally { setBusy(false); }
      }}>
        {register && <label className="form-label">Full name<input name="name" autoComplete="name" required maxLength={100} disabled={busy} /></label>}
        <label className="form-label">Email address<input name="email" type="email" autoComplete="email" required maxLength={254} disabled={busy} /></label>
        <label className="form-label">Password<input name="password" type="password" autoComplete={register ? "new-password" : "current-password"} required minLength={12} maxLength={128} disabled={busy} /></label>
        {register && <small className="muted">Use at least 12 characters. New accounts have student access.</small>}
        {error && <p className="connection-error" role="alert">{error}</p>}
        <button className="primary" disabled={busy}>{busy ? "Please wait…" : register ? "Create account →" : "Sign in →"}</button>
      </form>
      <p>{register ? "Already have an account?" : "New here?"} <button className="text-button" disabled={busy} onClick={() => { setRegister(!register); setError(""); }}>{register ? "Sign in" : "Create an account"}</button></p>
      <p className="auth-footnote">Student Identity is a separate campus integration. Use your Internly account here.</p>
    </section>
    <Link href="/">← Browse opportunities</Link>
  </main>;
}
