import Link from "next/link";
import { PRIVACY_CONTACT, PRIVACY_VERSION, REMEMBER_DAYS } from "@/lib/privacy";
export const metadata = { title: "Privacy & security — Internly" };
export default function PrivacyPage() {
  return (
    <main className="privacy-page">
      <Link href="/" className="auth-brand">
        internly<span>.</span>
      </Link>
      <header>
        <span className="eyebrow">PRIVACY & SECURITY</span>
        <h1>Your information, explained.</h1>
        <p>Notice version {PRIVACY_VERSION} · Effective 10 November 2026</p>
        <p>
          This notice describes the current Team 17 educational evaluation
          application. It is not a certification of legal compliance.
        </p>
      </header>
      <section>
        <h2>Who is responsible and how to contact us</h2>
        <p>
          The Team 17 Internship Management project team operates this
          application. Contact the project privacy representative at{" "}
          <a
            href={`mailto:${PRIVACY_CONTACT}?subject=Internly%20privacy%20request`}
          >
            {PRIVACY_CONTACT}
          </a>{" "}
          for privacy questions and requests. We do not represent that a formal
          institutional data protection officer has been appointed.
        </p>
      </section>
      <section>
        <h2>Information and purposes</h2>
        <dl>
          <dt>Student sign-in</dt>
          <dd>
            Your student ID and password are sent through our backend to Student
            Identity. We verify its authenticated profile, then store your
            student ID, name and Internly account/session. We do not persist
            your Identity password or provider token.
          </dd>
          <dt>Advisor accounts</dt>
          <dd>
            We store your name, email and a password hash for registration and
            login. Advisor registration does not verify staff status.
          </dd>
          <dt>Internship work</dt>
          <dd>
            We store advisor requests and introductions, connections,
            application statements and opportunity references, review decisions,
            reports and feedback to deliver the internship and advising
            workflow.
          </dd>
          <dt>Security and operation</dt>
          <dd>
            Session and rate-limit records may include IP address, user agent
            and request timestamps. Hosting and operational logs support
            availability, abuse prevention and troubleshooting.
          </dd>
        </dl>
        <p>
          Account information is needed for protected features. You can browse
          public opportunities without signing in. We do not install advertising
          or analytics trackers.
        </p>
      </section>
      <section>
        <h2>Sharing and external services</h2>
        <p>
          Internship records are restricted to their student, connected advisor
          and project administrators. A connection request shares the student's
          name, ID and introduction with the selected advisor before acceptance;
          acceptance allows access to the internship records. Choose an advisor
          you recognise.
        </p>
        <p>
          Student Identity authenticates students and separately controls
          profile sharing. The current profile-claims integration permits
          signed-in users to request a student profile when the provider
          authorizes our registered service; it is not restricted by
          internship-advisor assignment. Manage or revoke that sharing in{" "}
          <a
            href="https://student-identity.onrender.com/#/consent"
            target="_blank"
            rel="noopener noreferrer"
          >
            Student Identity
          </a>
          . This notice does not authorize disclosure of another person's
          profile.
        </p>
        <p>
          Our backend reads public Job Board listings without sending student
          application or profile data to that service. Internly applications are
          stored here, not submitted to the external Job Board. The separate A5
          demonstration webhook uses its own contract and does not automatically
          publish real application approvals.
        </p>
        <p>
          Vercel hosts the deployed app and Supabase stores its hosted records.
          Their infrastructure may process data outside your location; this
          project has not completed an assessment of all provider/subprocessor
          locations and international-transfer arrangements. Local development
          uses separate local databases.
        </p>
      </section>
      <section>
        <h2>Retention</h2>
        <p>
          Our project target is to review and delete or anonymise evaluation
          accounts and internship records within 90 days after final evaluation,
          unless a documented assessment or legal obligation requires longer
          retention. This is a manual review target, not an automatic deletion
          job. Until reviewed and removed, account and workspace records remain
          stored. Contact us to request earlier deletion or ask about an
          applicable hold.
        </p>
        <p>
          Student sessions last up to 15 minutes and advisor sessions up to
          seven days. Browser session storage keeps this notice acknowledgement
          for the current tab, up to 24 hours. If you choose optional device
          storage, the acknowledgement is kept for up to {REMEMBER_DAYS} days;
          an updated notice or expired preference prompts you again. Choosing
          essential settings removes that optional record.
        </p>
        <p>
          Hosting-log and backup retention follows the applicable provider
          settings and access controls. We have not configured a single
          automatic log/backup deletion schedule for this project. Deleting a
          browser preference does not delete account records, applications or
          reports.
        </p>
      </section>
      <section>
        <h2>Your choices and requests</h2>
        <p>
          You may ask about access, correction, a copy/export, deletion,
          restriction, objection or withdrawal of optional consent, where
          applicable. Email the contact above with the request type and enough
          account context to identify your request; do not send a password,
          service key or full identity document. We may need a proportionate
          identity check before disclosing or changing records. These requests
          are handled manually, and some may be subject to applicable
          obligations or exceptions.
        </p>
        <p>
          Use the Privacy & security button on any page to withdraw optional
          device storage or change your preference. This does not disable
          required sign-in cookies or revoke your separate Student Identity
          consent. Sign out to end your session; contact us for account
          deletion. You may also contact Thailand's Personal Data Protection
          Committee about a privacy concern.
        </p>
      </section>
      <section>
        <h2>Safe use</h2>
        <ul>
          <li>
            Use your own student or advisor account. Do not share passwords,
            sign-in cookies or integration keys.
          </li>
          <li>
            Do not put sensitive health, financial, government-ID or unrelated
            third-party information in introductions, statements or reports.
          </li>
          <li>
            Review the advisor's identity before connecting. Reject unexpected
            requests and report suspicious activity.
          </li>
          <li>
            The deployed site uses HTTPS and secure session cookies. Local
            development may use HTTP on localhost; do not expose a development
            server publicly.
          </li>
        </ul>
        <p>
          The notice and preference controls do not replace access control,
          provider consent or the project team's ongoing privacy/security
          responsibilities.
        </p>
      </section>
      <footer>
        <Link href="/" className="primary">
          Return to Internly →
        </Link>
        <a
          href="https://www.pdpc.or.th/2304/"
          target="_blank"
          rel="noopener noreferrer"
        >
          PDPC privacy-notice guidance ↗
        </a>
      </footer>
    </main>
  );
}
