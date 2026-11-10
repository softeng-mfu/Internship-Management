"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  createPrivacyChoice,
  readPrivacyChoice,
  PRIVACY_CONTACT,
  PRIVACY_STORAGE_KEY,
  PRIVACY_VERSION,
  REMEMBER_DAYS,
} from "@/lib/privacy";

export default function PrivacyNotice() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false),
    [remember, setRemember] = useState(false),
    [message, setMessage] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  useEffect(() => {
    let local = null,
      session = null;
    try {
      local = readPrivacyChoice(localStorage.getItem(PRIVACY_STORAGE_KEY));
    } catch {}
    try {
      session = readPrivacyChoice(sessionStorage.getItem(PRIVACY_STORAGE_KEY));
    } catch {}
    const choice = local?.rememberDevice ? local : session;
    setRemember(Boolean(local?.rememberDevice));
    if (!choice && pathname !== "/privacy") setOpen(true);
    const sync = (event: StorageEvent) => {
      if (event.key === PRIVACY_STORAGE_KEY)
        setRemember(Boolean(readPrivacyChoice(event.newValue)?.rememberDevice));
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
    // A shared root layout retains this state across navigation; reopening is always available.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open) {
      previousFocus.current = document.activeElement as HTMLElement | null;
      element.showModal();
      const overflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = overflow;
        if (element.open) element.close();
        previousFocus.current?.focus();
      };
    }
  }, [open]);
  function save(rememberDevice: boolean) {
    const choice = JSON.stringify(createPrivacyChoice(rememberDevice));
    let saved = false;
    try {
      localStorage.removeItem(PRIVACY_STORAGE_KEY);
      if (rememberDevice) {
        localStorage.setItem(PRIVACY_STORAGE_KEY, choice);
        saved = true;
      }
    } catch {}
    try {
      sessionStorage.setItem(PRIVACY_STORAGE_KEY, choice);
      saved = true;
    } catch {}
    setRemember(rememberDevice);
    setOpen(false);
    setMessage(
      saved
        ? rememberDevice
          ? "Privacy choice saved for this device."
          : "Essential settings selected. Optional device storage is off."
        : "Your choice applies for this visit. This browser could not save it.",
    );
  }
  return (
    <>
      <button
        ref={trigger}
        className="privacy-trigger"
        type="button"
        onClick={() => {
          setMessage("");
          setOpen(true);
        }}
      >
        Privacy & security
      </button>
      <span className="privacy-status" role="status">
        {message}
      </span>
      <dialog
        ref={dialog}
        className="privacy-dialog"
        aria-labelledby="privacy-title"
        aria-describedby="privacy-intro"
        onCancel={(event) => {
          event.preventDefault();
          save(false);
        }}
      >
        <div className="privacy-dialog-header">
          <span className="eyebrow">YOUR DATA. CLEAR CHOICES.</span>
          <button
            type="button"
            className="privacy-close"
            aria-label="Continue with essential settings"
            onClick={() => save(false)}
          >
            ×
          </button>
          <h2 id="privacy-title">Privacy, before we begin.</h2>
          <p id="privacy-intro">
            Understand how Internly handles your information, then choose how
            this device remembers your preference.
          </p>
        </div>
        <div className="privacy-dialog-body">
          <section className="privacy-summary">
            <h3>What we use, and why</h3>
            <p>
              Your student identity or advisor account, advisor connections,
              internship applications, reports and feedback support the
              internship workflow. Sign-in cookies and basic security logs help
              protect accounts.
            </p>
          </section>
          <section className="privacy-summary">
            <h3>Who can see it</h3>
            <p>
              Your internship records are available to you, your connected
              advisor and project administrators. Identity profile sharing has
              separate controls in Student Identity; this notice does not grant
              or change that consent.
            </p>
          </section>
          <section className="privacy-security">
            <h3>A few security essentials</h3>
            <ul>
              <li>
                Use your own account and keep passwords and service keys
                private.
              </li>
              <li>
                Connect only with an advisor you recognise; registration alone
                does not verify staff status.
              </li>
              <li>
                Keep health, financial and other sensitive information out of
                application statements and reports.
              </li>
            </ul>
          </section>
          <div className="privacy-storage">
            <div>
              <strong>Essential sign-in & security</strong>
              <span>
                Required when you use protected features. No advertising or
                analytics trackers are installed by this app.
              </span>
            </div>
            <span className="privacy-required">Essential</span>
          </div>
          <label className="privacy-optional">
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
            />
            <span>
              <strong>Remember my privacy choice on this device</strong>
              <small>
                Optional local storage for up to {REMEMBER_DAYS} days. Leave off
                on a shared computer. Turning this off removes the saved device
                choice.
              </small>
            </span>
          </label>
          <p className="privacy-fineprint">
            With essential settings, acknowledgement lasts in this browser tab
            for up to 24 hours. All app features remain available without
            optional device storage. This is acknowledgement of the notice, not
            blanket consent to unrelated data use.
          </p>
          <p className="privacy-fineprint">
            Questions or access, correction and deletion requests:{" "}
            <a
              href={`mailto:${PRIVACY_CONTACT}?subject=Internly%20privacy%20request`}
            >
              {PRIVACY_CONTACT}
            </a>
            . Project records are targeted for manual deletion/anonymisation
            review within 90 days after final evaluation; automatic cleanup is
            not enabled.
          </p>
          <Link
            href="/privacy"
            className="privacy-policy-link"
            onClick={() => setOpen(false)}
          >
            Read the full privacy & security notice →
          </Link>
        </div>
        <div className="privacy-dialog-footer">
          <button
            type="button"
            className="secondary"
            onClick={() => save(false)}
          >
            Use essential settings
          </button>
          <button
            type="button"
            className="primary"
            onClick={() => save(remember)}
          >
            {remember ? "Save choice & continue" : "Acknowledge & continue"}
          </button>
          <small>
            Notice version {PRIVACY_VERSION}. Change your choice anytime using
            Privacy & security.
          </small>
        </div>
      </dialog>
    </>
  );
}
