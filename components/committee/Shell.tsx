"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/client";

export interface ShellProps {
  name: string;
  roleLabel: string;
  owner: boolean;
  decide: boolean;
  counts: Record<string, number>;
  children: React.ReactNode;
}

type Item = { href: string; label: string; count?: number; hot?: boolean };
type Group = { id: string; label: string; icon: React.ReactNode; items: Item[] };

const I = {
  dash: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></svg>,
  apps: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5M9 13h6M9 17h4" /></svg>,
  me: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 11l3 3 8-8" /><path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9" /></svg>,
  admin: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0M17 11a3 3 0 1 0 0-6M21.5 20a5.5 5.5 0 0 0-4-5.3" /></svg>,
  chev: <svg className="chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6" /></svg>,
  search: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>,
  menu: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7h16M4 12h16M4 17h16" /></svg>,
};

const crumbNames: Record<string, string> = { applications: "Applications", staff: "Committee members", activity: "Activity log", account: "Your account" };

export default function Shell({ name, roleLabel, owner, decide, counts, children }: ShellProps) {
  const path = usePathname();
  const params = useSearchParams();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const search = useRef<HTMLInputElement>(null);
  const status = params.get("status") ?? "";

  useEffect(() => setOpen(false), [path, status]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        search.current?.focus();
        search.current?.select();
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const decided = (counts.awarded ?? 0) + (counts.waitlisted ?? 0) + (counts.not_selected ?? 0);
  const groups: Group[] = [
    {
      id: "apps",
      label: "Applications",
      icon: I.apps,
      items: [
        { href: "/committee/applications?status=submitted", label: "New, not yet opened", count: counts.submitted, hot: counts.submitted > 0 },
        { href: "/committee/applications?status=under_review", label: "Under review", count: counts.under_review },
        { href: "/committee/applications?status=interview", label: "Interview", count: counts.interview },
        { href: "/committee/applications?status=decided", label: "Decided", count: decided },
        { href: "/committee/applications?status=all", label: "All submitted" },
        { href: "/committee/applications?status=draft", label: "Still in progress", count: counts.draft },
      ],
    },
    {
      id: "me",
      label: "My work",
      icon: I.me,
      items: [{ href: "/committee/applications?status=mine", label: "Awaiting my score", count: counts.my_queue, hot: counts.my_queue > 0 }],
    },
  ];
  if (owner || decide) {
    const items: Item[] = [];
    if (owner) items.push({ href: "/committee/staff", label: "Committee members" }, { href: "/committee/activity", label: "Activity log" });
    items.push({ href: "/api/committee/export", label: "Export to spreadsheet" });
    groups.push({ id: "admin", label: "Administration", icon: I.admin, items });
  }

  const isActive = (href: string) => {
    const u = new URL(href, "http://x");
    if (u.pathname !== path) return false;
    const s = u.searchParams.get("status");
    return s ? s === status || (s === "all" && !status) : true;
  };
  const inGroup = (g: Group) => g.items.some((i) => isActive(i.href)) || (g.id === "apps" && path.startsWith("/committee/applications/"));

  const parts = path.split("/").filter(Boolean).slice(1);
  const crumbs = parts.length === 0 ? ["Dashboard"] : [crumbNames[parts[0]] ?? parts[0], ...(parts[1] ? ["Application"] : [])];

  return (
    <div className={`c-shell${open ? " open" : ""}`}>
      <aside className="c-side" aria-label="Console menu">
        <Link href="/committee" className="c-brand">
          <span className="crest">
            <img src="/crest.png" alt="" width={30} height={28} />
          </span>
          <span>
            <b>Access Scholarship</b>
            <span>Committee</span>
          </span>
        </Link>
        <nav className="c-nav">
          <Link className="c-link" href="/committee" aria-current={path === "/committee" ? "page" : undefined}>
            {I.dash} Dashboard
          </Link>
          {groups.map((g) => (
            <details key={g.id} className="c-group" open={inGroup(g) || g.id === "apps" || undefined}>
              <summary>
                {g.icon} {g.label} {I.chev}
              </summary>
              <div className="c-sub">
                {g.items.map((i) =>
                  i.href.startsWith("/api/") ? (
                    <a key={i.href} className="c-link" href={i.href}>
                      {i.label}
                    </a>
                  ) : (
                    <Link key={i.href} className="c-link" href={i.href} aria-current={isActive(i.href) ? "page" : undefined}>
                      {i.label}
                      {i.count !== undefined && <span className={`c-count${i.hot ? " hot" : ""}`}>{i.count}</span>}
                    </Link>
                  ),
                )}
              </div>
            </details>
          ))}
        </nav>
        <div className="c-sidefoot">
          <Link href="/committee/account" className="c-me" style={{ textDecoration: "none" }}>
            <span className="c-avatar">{name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase()}</span>
            <span>
              <b>{name}</b>
              <span>{roleLabel}</span>
            </span>
          </Link>
          <button
            className="c-link"
            style={{ border: 0, background: "transparent", font: "inherit", textAlign: "left" }}
            onClick={async () => {
              await api("/api/committee/signout", { method: "POST" }).catch(() => {});
              window.location.href = "/committee/signin";
            }}
          >
            Sign out
          </button>
        </div>
      </aside>
      <div className="c-scrim" onClick={() => setOpen(false)} />
      <div className="c-main">
        <header className="c-top">
          <button className="c-menu" aria-label="Open menu" onClick={() => setOpen(true)}>
            {I.menu}
          </button>
          <nav className="c-crumbs" aria-label="You are here">
            <Link href="/committee">Committee</Link>
            {crumbs.map((c, i) => (
              <span key={i} style={{ display: "contents" }}>
                <span aria-hidden>/</span>
                {i === crumbs.length - 1 ? <b>{c}</b> : <Link href={`/committee/${parts[0]}`}>{c}</Link>}
              </span>
            ))}
          </nav>
          <form
            className="c-search"
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              const v = search.current?.value.trim() ?? "";
              router.push(`/committee/applications?status=all${v ? `&q=${encodeURIComponent(v)}` : ""}`);
            }}
          >
            {I.search}
            <input ref={search} type="search" placeholder="Name, email or reference" aria-label="Search applications" defaultValue={params.get("q") ?? ""} />
            <kbd>Ctrl K</kbd>
          </form>
        </header>
        <main id="main" className="c-body">
          {children}
        </main>
      </div>
    </div>
  );
}
