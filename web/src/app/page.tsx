"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import ActivityPanel from "./activity-panel";
type Job = {
  id: number;
  title: string;
  company: string;
  mark: string;
  color: string;
  location: string;
  category: string;
  mode: string;
  pay: string;
  tags: string[];
  description: string;
};
type App = {
  id: number;
  jobId: number;
  status: string;
  date: string;
  statement: string;
};
type Report = { week: number; summary: string; date: string };
const jobs: Job[] = [
  {
    id: 1,
    title: "Product Design Intern",
    company: "Linear",
    mark: "◒",
    color: "lavender",
    location: "Bangkok, Thailand",
    category: "Design",
    mode: "Hybrid",
    pay: "฿12,000 / month",
    tags: ["Figma", "UI/UX", "Prototyping"],
    description:
      "Turn complex workflows into thoughtful, intuitive experiences. Work alongside a product designer on research, wireframes, prototypes, and a small feature from concept to handoff.",
  },
  {
    id: 2,
    title: "Frontend Developer Intern",
    company: "Vercel",
    mark: "▲",
    color: "ink",
    location: "Remote",
    category: "Engineering",
    mode: "Remote",
    pay: "฿15,000 / month",
    tags: ["React", "Next.js", "TypeScript"],
    description:
      "Build accessible interfaces and discover how modern web applications come together. Collaborate with engineers, review code, and ship a small project with a dedicated mentor.",
  },
  {
    id: 3,
    title: "Marketing & Growth Intern",
    company: "Notion",
    mark: "N",
    color: "cream",
    location: "Bangkok, Thailand",
    category: "Marketing",
    mode: "On-site",
    pay: "฿10,000 / month",
    tags: ["Content", "Strategy", "Analytics"],
    description:
      "Bring fresh ideas to campaigns that help people discover better ways to work. Explore audience research, create content, and use campaign results to tell a clear story.",
  },
  {
    id: 4,
    title: "Software Engineering Intern",
    company: "Agoda",
    mark: "a",
    color: "blue",
    location: "Bangkok, Thailand",
    category: "Engineering",
    mode: "Hybrid",
    pay: "฿18,000 / month",
    tags: ["JavaScript", "SQL", "APIs"],
    description:
      "Practice building reliable services with a collaborative team. Learn API design, database queries, testing, and delivery through a mentored project.",
  },
  {
    id: 5,
    title: "Data Analyst Intern",
    company: "Grab",
    mark: "G",
    color: "green",
    location: "Chiang Mai, Thailand",
    category: "Data",
    mode: "Hybrid",
    pay: "฿12,000 / month",
    tags: ["Python", "SQL", "Visualization"],
    description:
      "Turn everyday questions into useful insights. Explore sample datasets, build clear visualizations, and share recommendations with a friendly analytics team.",
  },
  {
    id: 6,
    title: "Brand Design Intern",
    company: "Canva",
    mark: "C",
    color: "pink",
    location: "Remote",
    category: "Design",
    mode: "Remote",
    pay: "฿14,000 / month",
    tags: ["Branding", "Illustration", "Figma"],
    description:
      "Explore visual storytelling with a creative team. Develop campaign concepts, create brand assets, and refine your design process through feedback and collaboration.",
  },
];
const seed: App[] = [
  {
    id: 101,
    jobId: 4,
    status: "Under review",
    date: "2026-10-30",
    statement:
      "I would love to build useful software with a collaborative team.",
  },
  {
    id: 102,
    jobId: 1,
    status: "Approved",
    date: "2026-10-27",
    statement: "I want to grow my research and product design skills.",
  },
  {
    id: 103,
    jobId: 3,
    status: "Submitted",
    date: "2026-10-25",
    statement: "I am excited to explore creative marketing.",
  },
];
const navigation = [
  ["Overview", "grid"],
  ["Opportunities", "briefcase"],
  ["My applications", "file"],
  ["Progress reports", "chart"],
  ["Saved opportunities", "bookmark"],
  ["Integration activity", "spark"],
];
function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const p: Record<string, ReactNode> = {
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </>
    ),
    briefcase: (
      <>
        <rect x="3" y="7" width="18" height="14" rx="2" />
        <path d="M8 7V4h8v3M3 12c5 4 13 4 18 0M10 13h4" />
      </>
    ),
    file: <path d="M14 3H5v18h14V8zM14 3v6h5M8 13h8M8 17h5" />,
    chart: <path d="M4 3v18h17M9 16v-5M14 16V7M19 16v-8" />,
    bookmark: <path d="M6 3h12v18l-6-4-6 4z" />,
    arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
    chevron: <path d="m9 5 7 7-7 7" />,
    down: <path d="m6 9 6 6 6-6" />,
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 5 5" />
      </>
    ),
    bell: (
      <>
        <path d="M5 16h14l-2-4V8a5 5 0 0 0-10 0v4zM10 20h4" />
      </>
    ),
    pin: (
      <>
        <path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" />
        <circle cx="12" cy="10" r="2" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    help: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 5M12 17h.01" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M7 3v5M17 3v5M3 11h18" />
      </>
    ),
    spark: (
      <path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z" />
    ),
    menu: <path d="M4 6h16M4 12h16M4 18h16" />,
    book: (
      <path d="M12 5C8 2 3 4 3 4v15s5-2 9 1c4-3 9-1 9-1V4s-5-2-9 1zM12 5v15" />
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {p[name] ?? p.grid}
    </svg>
  );
}
function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-heading">
        <h2>{title}</h2>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <Icon name="close" />
        </button>
      </div>
      {children}
    </dialog>
  );
}
const dateLabel = (d: string) =>
  new Date(d + "T12:00:00").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
export default function Home() {
  const [view, setView] = useState("Overview"),
    [saved, setSaved] = useState([2, 6]),
    [applications, setApplications] = useState<App[]>(seed),
    [reports, setReports] = useState<Report[]>([]),
    [loaded, setLoaded] = useState(false),
    [query, setQuery] = useState(""),
    [category, setCategory] = useState("All opportunities"),
    [mode, setMode] = useState("All arrangements"),
    [selected, setSelected] = useState<Job | null>(null),
    [modal, setModal] = useState<string | null>(null),
    [toast, setToast] = useState(""),
    [mobile, setMobile] = useState(false),
    [statusFilter, setStatusFilter] = useState("All applications");
  useEffect(() => {
    try {
      const d = JSON.parse(localStorage.getItem("internly-demo-v1") ?? "null");
      if (
        d &&
        Array.isArray(d.saved) &&
        Array.isArray(d.applications) &&
        Array.isArray(d.reports)
      ) {
        setSaved(d.saved);
        setApplications(d.applications);
        setReports(d.reports);
      }
    } catch {}
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded)
      try {
        localStorage.setItem(
          "internly-demo-v1",
          JSON.stringify({ saved, applications, reports }),
        );
      } catch {}
  }, [loaded, saved, applications, reports]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(t);
  }, [toast]);
  function go(v: string) {
    setView(v);
    setQuery("");
    setMobile(false);
  }
  function toggleSave(id: number) {
    setSaved((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }
  const approved = applications.find((a) => a.status === "Approved"),
    approvedJob = jobs.find((j) => j.id === approved?.jobId);
  const filtered = jobs.filter(
    (j) =>
      (view !== "Saved opportunities" || saved.includes(j.id)) &&
      (category === "All opportunities" || j.category === category) &&
      (mode === "All arrangements" || j.mode === mode) &&
      `${j.title} ${j.company} ${j.tags.join(" ")} ${j.location}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  function card(j: Job) {
    return (
      <article className="job-card" key={j.id}>
        <div className="job-card-top">
          <div className={`company-logo ${j.color}`}>{j.mark}</div>
          <button
            className={`save-button ${saved.includes(j.id) ? "is-saved" : ""}`}
            aria-label={`${saved.includes(j.id) ? "Unsave" : "Save"} ${j.title}`}
            aria-pressed={saved.includes(j.id)}
            onClick={() => toggleSave(j.id)}
          >
            <Icon name="bookmark" size={19} />
          </button>
        </div>
        <p className="company-name">
          {j.company}
          <span> · {j.category}</span>
        </p>
        <button className="job-title" onClick={() => setSelected(j)}>
          {j.title}
        </button>
        <p className="location">
          <Icon name="pin" size={14} />
          {j.location}
          <span>·</span>
          {j.mode}
        </p>
        <div className="tags">
          {j.tags.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
        <div className="job-card-bottom">
          <span>{j.pay}</span>
          <button aria-label={`View ${j.title}`} onClick={() => setSelected(j)}>
            <Icon name="arrow" size={19} />
          </button>
        </div>
      </article>
    );
  }
  function table(limit?: number) {
    const items = applications
      .filter(
        (a) =>
          jobs.some((j) => j.id === a.jobId) &&
          (view === "Overview" ||
            statusFilter === "All applications" ||
            a.status === statusFilter),
      )
      .slice(0, limit);
    return items.length ? (
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>OPPORTUNITY</th>
              <th>DATE APPLIED</th>
              <th>STATUS</th>
              <th aria-label="View details" />
            </tr>
          </thead>
          <tbody>
            {items.map((a) => {
              const j = jobs.find((j) => j.id === a.jobId)!;
              return (
                <tr key={a.id}>
                  <td>
                    <div className="table-job">
                      <span className={`company-logo small ${j.color}`}>
                        {j.mark}
                      </span>
                      <div>
                        <button onClick={() => setSelected(j)}>
                          {j.title}
                        </button>
                        <small>{j.company}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    {dateLabel(a.date)}, {a.date.slice(0, 4)}
                  </td>
                  <td>
                    <span
                      className={`status ${a.status.toLowerCase().replace(" ", "-")}`}
                    >
                      <i />
                      {a.status}
                    </span>
                  </td>
                  <td>
                    <button
                      className="icon-button"
                      aria-label={`Open application for ${j.title}`}
                      onClick={() => setSelected(j)}
                    >
                      <Icon name="chevron" size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    ) : (
      <div className="empty">
        <Icon name="file" size={32} />
        <h3>No applications here yet.</h3>
        <p>Find an opportunity that feels like your next step.</p>
        <button className="primary" onClick={() => go("Opportunities")}>
          Explore opportunities <Icon name="arrow" size={16} />
        </button>
      </div>
    );
  }
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <aside className={`sidebar ${mobile ? "open" : ""}`}>
        <a className="brand" href="/">
          <span className="brand-icon">
            i<span>↗</span>
          </span>
          internly<span className="brand-period">.</span>
        </a>
        <div className="workspace-label">YOUR WORKSPACE</div>
        <nav aria-label="Main navigation">
          {navigation.map(([name, icon]) => (
            <button
              key={name}
              className={`nav-item ${view === name ? "active" : ""}`}
              onClick={() => go(name)}
              aria-current={view === name ? "page" : undefined}
            >
              <Icon name={icon} />
              <span>{name}</span>
              {name === "My applications" && (
                <span className="nav-count">{applications.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <Icon name="spark" size={23} />
            <h3>
              Big dreams.
              <br />
              Small steps.
            </h3>
            <p>
              Your next chapter starts
              <br />
              with one opportunity.
            </p>
            <button onClick={() => go("Opportunities")}>
              Find your next step <Icon name="arrow" size={15} />
            </button>
            <div className="note-orbit" />
          </div>
          <button className="nav-item" onClick={() => setModal("help")}>
            <Icon name="help" />
            <span>Help & resources</span>
            <Icon name="arrow" size={16} />
          </button>
          <button className="profile" onClick={() => setModal("profile")}>
            <span className="avatar">NZ</span>
            <span>
              <strong>Nadi Zeya</strong>
              <small>Student workspace</small>
            </span>
            <Icon name="down" size={16} />
          </button>
        </div>
      </aside>
      {mobile && (
        <button
          className="sidebar-shade"
          onClick={() => setMobile(false)}
          aria-label="Close navigation"
        />
      )}
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-menu"
              aria-label="Open navigation"
              aria-expanded={mobile}
              onClick={() => setMobile(!mobile)}
            >
              <Icon name="menu" />
            </button>
            <span>Workspace</span>
            <Icon name="chevron" size={12} />
            <strong>{view}</strong>
          </div>
          <div className="topbar-right">
            <span className="demo-badge">
              <i />
              {view === "Integration activity"
                ? "Live database"
                : "Demo workspace"}
            </span>
            <button
              className="icon-button notification-button"
              onClick={() => setModal("notifications")}
              aria-label="Notifications"
            >
              <Icon name="bell" />
              <i />
            </button>
            <button
              className="avatar small-avatar"
              aria-label="Open profile"
              onClick={() => setModal("profile")}
            >
              NZ
            </button>
          </div>
        </header>
        <main id="main-content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">YOUR NEXT CHAPTER</div>
              <h1>
                {view === "Overview" ? "A little closer to your future." : view}
              </h1>
              <p>
                {view === "Overview"
                  ? "Welcome back, Nadi. Let’s make your next move a meaningful one."
                  : view === "Opportunities"
                    ? "Find a place to learn, contribute, and become who you want to be."
                    : view === "My applications"
                      ? "Every application is a step forward. Keep track of yours here."
                      : view === "Progress reports"
                        ? "Small wins add up. Capture what you’re learning along the way."
                        : view === "Integration activity"
                          ? "Real integration records, with a little more clarity."
                          : view === "Advisor queue"
                            ? "Help students take their next step. Review sample applications."
                            : "Good possibilities, kept close. Come back when you’re ready."}
              </p>
            </div>
            <span className="semester">
              <Icon name="calendar" size={16} />
              Semester 2, 2026
            </span>
          </div>
          {view === "Overview" && (
            <>
              <section className="hero">
                <div className="hero-copy">
                  <span className="hero-label">
                    <i />A WORLD OF POSSIBILITIES
                  </span>
                  <h2>
                    Your potential.
                    <br />
                    Meet your opportunity.
                  </h2>
                  <p>
                    Discover internships that match your curiosity.
                    <br />
                    Build skills, find your people, and take that first step.
                  </p>
                  <button
                    className="dark-button"
                    onClick={() => go("Opportunities")}
                  >
                    Explore opportunities <Icon name="arrow" size={18} />
                  </button>
                </div>
                <div className="hero-art" aria-hidden="true">
                  <div className="art-orbit orbit-one" />
                  <div className="art-orbit orbit-two" />
                  <span className="art-star">✳</span>
                  <span className="art-label">THE FUTURE IS YOURS ↗</span>
                  <div className="art-step step-one" />
                  <div className="art-step step-two" />
                  <div className="art-step step-three" />
                  <div className="art-arrow">↗</div>
                  <div className="art-dot" />
                  <span className="art-caption">a new perspective.</span>
                </div>
              </section>
              <section className="stats" aria-label="Internship summary">
                {[
                  {
                    label: "Applications sent",
                    value: applications.length,
                    note: "You’re putting yourself out there",
                    icon: "file",
                    tone: "orange",
                  },
                  {
                    label: "In review",
                    value: applications.filter((a) =>
                      ["Submitted", "Under review"].includes(a.status),
                    ).length,
                    note: "Good things take a little time",
                    icon: "clock",
                    tone: "purple",
                  },
                  {
                    label: "Approved",
                    value: applications.filter((a) => a.status === "Approved")
                      .length,
                    note: "Your next chapter is taking shape",
                    icon: "check",
                    tone: "sage",
                  },
                  {
                    label: "Saved opportunities",
                    value: saved.length,
                    note: "A few possibilities to come back to",
                    icon: "bookmark",
                    tone: "sand",
                  },
                ].map((s) => (
                  <button
                    className="stat"
                    key={s.label}
                    onClick={() =>
                      go(
                        s.icon === "bookmark"
                          ? "Saved opportunities"
                          : "My applications",
                      )
                    }
                  >
                    <div>
                      <span className="stat-label">{s.label}</span>
                      <strong>{String(s.value).padStart(2, "0")}</strong>
                      <small>{s.note}</small>
                    </div>
                    <span className={`stat-icon ${s.tone}`}>
                      <Icon name={s.icon} />
                    </span>
                  </button>
                ))}
              </section>
              <div className="dashboard-columns">
                <section className="applications-panel">
                  <div className="section-heading">
                    <div>
                      <h2>
                        Your applications{" "}
                        <span className="count-pill">
                          {applications.length}
                        </span>
                      </h2>
                      <p>A snapshot of where things stand.</p>
                    </div>
                    <button
                      className="text-button"
                      onClick={() => go("My applications")}
                    >
                      View all <Icon name="arrow" size={16} />
                    </button>
                  </div>
                  {table(3)}
                </section>
                <section className="next-step">
                  <span className="mini-eyebrow">
                    <Icon name="spark" size={16} />
                    YOUR NEXT STEP
                  </span>
                  <h3>
                    Make your progress
                    <br />
                    part of the story.
                  </h3>
                  <p>
                    {approvedJob
                      ? `You’re approved at ${approvedJob.company}. Keep your advisor in the loop with a weekly update.`
                      : "Once approved, share your weekly learning with your advisor."}
                  </p>
                  <div className="progress-caption">
                    <span>Weekly reports submitted</span>
                    <strong>{reports.length}</strong>
                  </div>
                  <div className="progress-line">
                    <span
                      style={{
                        width: `${Math.min((reports.length / 12) * 100, 100)}%`,
                      }}
                    />
                  </div>
                  <button
                    className="text-button"
                    onClick={() => go("Progress reports")}
                  >
                    Go to progress reports <Icon name="arrow" size={16} />
                  </button>
                </section>
              </div>
              <section className="recommended">
                <div className="section-heading">
                  <div>
                    <h2>
                      A few possibilities for you{" "}
                      <span className="tiny-spark">✳</span>
                    </h2>
                    <p>A little inspiration for your next move.</p>
                  </div>
                  <button
                    className="text-button"
                    onClick={() => go("Opportunities")}
                  >
                    Explore all <Icon name="arrow" size={16} />
                  </button>
                </div>
                <div className="job-grid">{jobs.slice(0, 3).map(card)}</div>
              </section>
            </>
          )}
          {["Opportunities", "Saved opportunities"].includes(view) && (
            <>
              <div className="filter-bar">
                <label className="search-field">
                  <Icon name="search" size={19} />
                  <input
                    aria-label="Search opportunities"
                    placeholder="Search roles, companies, or skills..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </label>
                <select
                  aria-label="Category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {[
                    "All opportunities",
                    "Design",
                    "Engineering",
                    "Marketing",
                    "Data",
                  ].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
                <select
                  aria-label="Work arrangement"
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                >
                  {["All arrangements", "Remote", "Hybrid", "On-site"].map(
                    (c) => (
                      <option key={c}>{c}</option>
                    ),
                  )}
                </select>
              </div>
              <div className="results-heading">
                <span>
                  <strong>{filtered.length}</strong> opportunities to explore
                </span>
                <span>Sample listings · Not accepting real applications</span>
              </div>
              {filtered.length ? (
                <div className="job-grid listing-grid">
                  {filtered.map(card)}
                </div>
              ) : (
                <div className="empty">
                  <Icon name="search" size={32} />
                  <h3>A fresh search might help.</h3>
                  <p>
                    Try another skill or filter, or save an opportunity to find
                    it here.
                  </p>
                  <button
                    className="secondary"
                    onClick={() => {
                      setQuery("");
                      setCategory("All opportunities");
                      setMode("All arrangements");
                      if (view === "Saved opportunities") go("Opportunities");
                    }}
                  >
                    Explore all opportunities
                  </button>
                </div>
              )}
            </>
          )}
          {view === "My applications" && (
            <section className="full-panel">
              <div className="section-heading">
                <h2>Your journey, at a glance</h2>
                <select
                  aria-label="Application status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  {[
                    "All applications",
                    "Submitted",
                    "Under review",
                    "Approved",
                    "Rejected",
                    "Withdrawn",
                  ].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              {table()}
            </section>
          )}
          {view === "Progress reports" && (
            <>
              <section className="report-banner">
                <div>
                  <span className="eyebrow">LEARNING IN MOTION</span>
                  <h2>
                    {approvedJob
                      ? `Your internship at ${approvedJob.company}`
                      : "Your internship journey"}
                  </h2>
                  <p>
                    {approvedJob
                      ? approvedJob.title
                      : "An approved application is needed to submit reports."}
                  </p>
                </div>
                <button
                  className="primary"
                  disabled={!approved}
                  onClick={() => setModal("report")}
                >
                  New weekly report <Icon name="arrow" size={17} />
                </button>
              </section>
              <section className="full-panel">
                <div className="section-heading">
                  <h2>Your weekly reflections</h2>
                  <span className="muted">{reports.length} reports</span>
                </div>
                {reports.length ? (
                  reports.map((r) => (
                    <article className="report-item" key={r.week}>
                      <span className="report-week">
                        {String(r.week).padStart(2, "0")}
                      </span>
                      <div>
                        <h3>Week {r.week} reflection</h3>
                        <p>{r.summary}</p>
                        <small>
                          Submitted {dateLabel(r.date)} · Demo report
                        </small>
                      </div>
                      <span className="status submitted">
                        <i />
                        Submitted
                      </span>
                    </article>
                  ))
                ) : (
                  <div className="empty">
                    <Icon name="book" size={34} />
                    <h3>Your learning deserves a little reflection.</h3>
                    <p>
                      Share your work, a small win, and your plan for next week.
                    </p>
                    <button
                      className="text-button"
                      disabled={!approved}
                      onClick={() => setModal("report")}
                    >
                      Write your first report <Icon name="arrow" size={16} />
                    </button>
                  </div>
                )}
              </section>
            </>
          )}
          {view === "Advisor queue" && (
            <section className="full-panel">
              <div className="section-heading">
                <div>
                  <h2>Applications to review</h2>
                  <p>
                    Preview only · Decisions change sample data in this browser.
                  </p>
                </div>
              </div>
              {applications.filter((a) =>
                ["Submitted", "Under review"].includes(a.status),
              ).length ? (
                applications
                  .filter((a) =>
                    ["Submitted", "Under review"].includes(a.status),
                  )
                  .map((a) => {
                    const j = jobs.find((j) => j.id === a.jobId);
                    return (
                      j && (
                        <article className="review-item" key={a.id}>
                          <div className={`company-logo ${j.color}`}>
                            {j.mark}
                          </div>
                          <div>
                            <h3>{j.title}</h3>
                            <p>Nadi Zeya · {j.company}</p>
                            <p className="statement">“{a.statement}”</p>
                            <div className="review-actions">
                              <button
                                className="primary"
                                onClick={() => {
                                  setApplications((items) =>
                                    items.map((x) =>
                                      x.id === a.id
                                        ? { ...x, status: "Approved" }
                                        : x,
                                    ),
                                  );
                                  setToast("Sample application approved.");
                                }}
                              >
                                Approve sample
                              </button>
                              <button
                                className="secondary"
                                onClick={() => {
                                  setApplications((items) =>
                                    items.map((x) =>
                                      x.id === a.id
                                        ? { ...x, status: "Rejected" }
                                        : x,
                                    ),
                                  );
                                  setToast(
                                    "Sample application marked as rejected.",
                                  );
                                }}
                              >
                                Reject sample
                              </button>
                            </div>
                          </div>
                        </article>
                      )
                    );
                  })
              ) : (
                <div className="empty">
                  <Icon name="check" size={32} />
                  <h3>You’re all caught up.</h3>
                  <p>No sample applications are waiting for review.</p>
                </div>
              )}
            </section>
          )}
          {view === "Integration activity" && <ActivityPanel />}
          <footer>
            <span>
              <b>internly.</b>A little direction. A world of possibility.
            </span>
            <span>
              {view === "Integration activity"
                ? "Live records · Read-only operator access"
                : "Sample data · Changes saved in this browser only"}
            </span>
          </footer>
        </main>
      </div>
      {selected && (
        <Modal title="A closer look" onClose={() => setSelected(null)}>
          <div className={`company-logo ${selected.color}`}>
            {selected.mark}
          </div>
          <p className="company-name">
            {selected.company} · Sample opportunity
          </p>
          <h2 className="detail-title">{selected.title}</h2>
          <p className="location">
            <Icon name="pin" size={15} />
            {selected.location} · {selected.mode}
          </p>
          <div className="tags">
            {selected.tags.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
          <div className="detail-facts">
            <div>
              <small>MONTHLY ALLOWANCE</small>
              <strong>{selected.pay}</strong>
            </div>
            <div>
              <small>DURATION</small>
              <strong>12 weeks · Flexible start</strong>
            </div>
          </div>
          <h3>Room to learn. Space to contribute.</h3>
          <p className="detail-description">{selected.description}</p>
          <p className="demo-note">
            Sample listing · Applying creates a demo record in this browser.
            Nothing is sent to the company.
          </p>
          {applications.some((a) => a.jobId === selected.id) ? (
            <div className="application-existing">
              <span className="status">
                <i />
                {applications.find((a) => a.jobId === selected.id)?.status}
              </span>
              <p>Your sample application is in your tracker.</p>
              {applications.some(
                (a) =>
                  a.jobId === selected.id &&
                  ["Submitted", "Under review"].includes(a.status),
              ) && (
                <button
                  className="secondary"
                  onClick={() => {
                    setApplications((items) =>
                      items.map((a) =>
                        a.jobId === selected.id
                          ? { ...a, status: "Withdrawn" }
                          : a,
                      ),
                    );
                    setToast("Sample application withdrawn.");
                  }}
                >
                  Withdraw sample application
                </button>
              )}
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = new FormData(e.currentTarget);
                setApplications((items) => [
                  {
                    id: Date.now(),
                    jobId: selected.id,
                    status: "Submitted",
                    date: new Date().toISOString().slice(0, 10),
                    statement: String(form.get("statement")),
                  },
                  ...items,
                ]);
                setToast("Demo application added to your tracker.");
                setSelected(null);
              }}
            >
              <label className="form-label" htmlFor="statement">
                What makes this opportunity exciting to you?
              </label>
              <textarea
                id="statement"
                name="statement"
                required
                minLength={20}
                maxLength={2000}
                placeholder="Your interests and what you’d like to learn…"
                rows={4}
              />
              <button className="primary form-submit">
                Submit demo application <Icon name="arrow" size={17} />
              </button>
            </form>
          )}
        </Modal>
      )}
      {modal === "report" && (
        <Modal
          title="A week worth reflecting on"
          onClose={() => setModal(null)}
        >
          <p className="muted">
            For your approved sample internship at {approvedJob?.company}.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget),
                week = Number(f.get("week"));
              if (reports.some((r) => r.week === week)) {
                setToast("A report for that week already exists.");
                return;
              }
              setReports((items) =>
                [
                  {
                    week,
                    summary: String(f.get("summary")),
                    date: new Date().toISOString().slice(0, 10),
                  },
                  ...items,
                ].sort((a, b) => b.week - a.week),
              );
              setModal(null);
              setToast("Your demo weekly report is saved.");
            }}
          >
            <label className="form-label" htmlFor="week">
              Internship week
            </label>
            <input
              id="week"
              name="week"
              type="number"
              min="1"
              max="52"
              required
              defaultValue={Math.min(reports.length + 1, 52)}
            />
            <label className="form-label" htmlFor="summary">
              What did you learn this week?
            </label>
            <textarea
              id="summary"
              name="summary"
              rows={6}
              required
              minLength={20}
              maxLength={4000}
              placeholder="Your work, a small win, a challenge, and what’s next…"
            />
            <p className="demo-note">
              Demo report · Saved to this browser only.
            </p>
            <button className="primary form-submit">
              Save weekly report <Icon name="arrow" size={17} />
            </button>
          </form>
        </Modal>
      )}
      {modal === "help" && (
        <Modal
          title="A little guidance goes a long way."
          onClose={() => setModal(null)}
        >
          {[
            [
              "briefcase",
              "Find your fit",
              "Search by role or skill, compare work arrangements, and bookmark your favorites.",
            ],
            [
              "file",
              "Tell your story",
              "Open an opportunity and write a short statement to try the demo application flow.",
            ],
            [
              "chart",
              "Keep growing",
              "Once approved, use weekly reports to reflect on your learning. Try the advisor preview from your profile to review sample applications.",
            ],
          ].map(([icon, title, text]) => (
            <div className="resource" key={title}>
              <Icon name={icon} />
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </div>
          ))}
          <p className="demo-note">
            Live accounts and internship database workflows are not connected
            yet. All listings and application actions are samples.
          </p>
        </Modal>
      )}
      {modal === "notifications" && (
        <Modal title="Your latest updates" onClose={() => setModal(null)}>
          <div className="resource">
            <span className="stat-icon sage">
              <Icon name="check" />
            </span>
            <div>
              <h3>
                {approved ? "A new chapter is waiting" : "Keep exploring"}
              </h3>
              <p>
                {approved
                  ? `Your sample application at ${approvedJob?.company} is approved. Record your learning in progress reports.`
                  : "Explore opportunities and submit a sample application to get started."}
              </p>
              <small>Demo notification</small>
            </div>
          </div>
          <button
            className="text-button"
            onClick={() => {
              setModal(null);
              go(approved ? "Progress reports" : "Opportunities");
            }}
          >
            Take a look <Icon name="arrow" size={16} />
          </button>
        </Modal>
      )}
      {modal === "profile" && (
        <Modal title="Your workspace" onClose={() => setModal(null)}>
          <div className="profile-detail">
            <span className="avatar">NZ</span>
            <div>
              <h3>Nadi Zeya</h3>
              <p>Student · Internship Management</p>
            </div>
          </div>
          <p className="demo-note">
            This is a sample workspace. The advisor preview demonstrates
            reviewing sample applications and grants no access to real student
            records.
          </p>
          <button
            className="primary"
            onClick={() => {
              setModal(null);
              go(view === "Advisor queue" ? "Overview" : "Advisor queue");
            }}
          >
            {view === "Advisor queue"
              ? "Back to student overview"
              : "Explore advisor preview"}
            <Icon name="arrow" size={17} />
          </button>
          <button className="text-button" style={{ display: "flex", marginTop: 22 }} onClick={() => {
            setApplications(seed); setSaved([2, 6]); setReports([]);
            setModal(null); go("Overview"); setToast("Sample workspace restored to its starting point.");
          }}>Reset sample workspace</button>
        </Modal>
      )}
      <div className={`toast ${toast ? "visible" : ""}`} role="status">
        {toast && (
          <>
            <Icon name="check" size={18} />
            {toast}
          </>
        )}
      </div>
    </div>
  );
}
