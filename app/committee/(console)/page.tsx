import Link from "next/link";
import { db } from "@/lib/db";
import { canDecide, requireStaffPage } from "@/lib/staff";
import { statusCounts } from "@/lib/committee";
import { programme } from "@/lib/content";
import { emailConfigured } from "@/lib/email";
import { statusLabels } from "@/lib/form";
import { actionLabels, Bars, statusColors, when } from "@/components/committee/bits";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const me = await requireStaffPage();
  const q = await db();
  const [c, today, daily, countries, majors, incomes, feed] = await Promise.all([
    statusCounts(me.id),
    q.query<{ submitted: number; started: number }>(
      "select count(*) filter (where submitted_at >= (date_trunc('day', now() at time zone 'Australia/Sydney') at time zone 'Australia/Sydney'))::int as submitted, count(*) filter (where created_at >= (date_trunc('day', now() at time zone 'Australia/Sydney') at time zone 'Australia/Sydney'))::int as started from applications",
    ),
    q.query<{ d: string; n: number }>(
      "select to_char(date_trunc('day', submitted_at at time zone 'Australia/Sydney'), 'YYYY-MM-DD') as d, count(*)::int as n from applications where submitted_at >= now() - interval '30 days' group by 1",
    ),
    q.query<{ label: string; n: number }>("select data->>'residence' as label, count(*)::int as n from applications where status <> 'draft' group by 1 order by 2 desc, 1 limit 6"),
    q.query<{ label: string; n: number }>("select data->>'major' as label, count(*)::int as n from applications where status <> 'draft' group by 1 order by 2 desc, 1 limit 6"),
    q.query<{ label: string; n: number }>("select data->>'income' as label, count(*)::int as n from applications where status <> 'draft' group by 1 order by 2 desc limit 6"),
    q.query<{ name: string | null; action: string; target: string | null; created_at: string }>(
      "select s.name, a.action, a.target, a.created_at from audit a left join staff s on s.id = a.staff_id where a.action not in ('signin_failed', 'mfa_failed') order by a.created_at desc limit 8",
    ),
  ]);

  const submittedTotal = c.submitted + c.under_review + c.interview + c.awarded + c.waitlisted + c.not_selected + c.accepted + c.declined_offer + c.enrolled;
  const daysLeft = Math.ceil((Date.parse(programme.deadlineISO) - Date.now()) / 864e5);
  const pipeline = (["draft", "submitted", "under_review", "interview", "awarded", "accepted", "enrolled", "waitlisted", "not_selected", "declined_offer"] as const).map((s) => ({ s, n: c[s] }));
  const pipeTotal = Math.max(1, pipeline.reduce((a, b) => a + b.n, 0));

  const perDay = new Map(daily.rows.map((r) => [r.d, Number(r.n)]));
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(Date.now() - (29 - i) * 864e5).toLocaleDateString("en-CA", { timeZone: "Australia/Sydney" });
    return { d, n: perDay.get(d) ?? 0 };
  });
  const maxDay = Math.max(1, ...days.map((d) => d.n));
  const last30 = days.reduce((a, b) => a + b.n, 0);

  const tasks = [
    { n: c.submitted, title: "New applications to open", sub: "Submitted and not yet under review", href: "/committee/applications?status=submitted" },
    { n: c.my_queue, title: "Awaiting your score", sub: "Under review or at interview, not scored by you", href: "/committee/applications?status=mine" },
    ...(canDecide(me)
      ? [{ n: c.interview, title: "Interviewed, awaiting decision", sub: "Ready for the chair to decide", href: "/committee/applications?status=interview" }]
      : [{ n: c.interview, title: "At interview", sub: "Shortlisted applicants", href: "/committee/applications?status=interview" }]),
    { n: c.docs_pending, title: "Identification documents to verify", sub: "From scholars who accepted their offer", href: "/committee/arrivals?view=documents" },
    { n: c.allowances_pending, title: "Allowance requests to decide", sub: "From admitted and enrolled scholars", href: "/committee/allowances?status=submitted" },
    { n: c.accepted, title: "Scholars due to report", sub: "Offer accepted, not yet enrolled", href: "/committee/arrivals?view=accepted" },
    ...(canDecide(me) && c.emails_unsent > 0
      ? [{ n: c.emails_unsent, title: "Emails not delivered", sub: emailConfigured() ? "Failed to send; resend from the log" : "Email is not set up yet", href: "/committee/emails?view=unsent" }]
      : []),
  ];

  return (
    <>
      <div className="c-head">
        <div>
          <h1>Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, {me.name.split(" ")[0]}</h1>
          <p>
            {programme.name} · {programme.cycle} · {daysLeft > 0 ? `${daysLeft} days until the deadline` : "Applications closed"}
          </p>
        </div>
        <Link href="/committee/applications?status=all" className="btn btn-ghost btn-sm">
          All applications
        </Link>
      </div>

      <h2 className="c-section-title">Needs a person</h2>
      <div className="c-card c-tasks">
        {tasks.map((t) => (
          <Link key={t.title} href={t.href} className={`c-task${t.n > 0 ? " hot" : ""}`}>
            <span className="big">{t.n}</span>
            <span>
              <b>{t.title}</b>
              <span>{t.sub}</span>
            </span>
          </Link>
        ))}
      </div>

      <h2 className="c-section-title">Today</h2>
      <div className="c-grid c-cols-4">
        <div className="c-card c-stat">
          <span>Submitted today</span>
          <b>{today.rows[0].submitted}</b>
        </div>
        <div className="c-card c-stat">
          <span>Started today</span>
          <b>{today.rows[0].started}</b>
        </div>
        <div className="c-card c-stat">
          <span>Submitted in total</span>
          <b>{submittedTotal}</b>
          <small>{c.draft} more in progress</small>
        </div>
        <div className="c-card c-stat">
          <span>Admitted</span>
          <b>{c.awarded + c.accepted + c.enrolled}</b>
          <small>{c.accepted + c.enrolled} accepted · {c.enrolled} enrolled</small>
        </div>
      </div>

      <h2 className="c-section-title">Pipeline</h2>
      <div className="c-card c-card-b">
        <div className="c-pipe" role="img" aria-label="Applications by stage">
          {pipeline.filter((p) => p.n > 0).map((p) => (
            <i key={p.s} style={{ width: `${(p.n / pipeTotal) * 100}%`, background: statusColors[p.s] }} title={`${statusLabels[p.s]}: ${p.n}`} />
          ))}
        </div>
        <div className="c-legend">
          {pipeline.map((p) => (
            <span key={p.s}>
              <i style={{ background: statusColors[p.s] }} />
              {statusLabels[p.s]} <b>{p.n}</b>
            </span>
          ))}
        </div>
      </div>

      <h2 className="c-section-title">Trend</h2>
      <div className="c-card">
        <div className="c-card-h">
          <h2>Submissions, last 30 days</h2>
          <span className="muted">{last30} in total</span>
        </div>
        <div className="c-card-b">
          <svg viewBox="0 0 300 80" width="100%" height="120" preserveAspectRatio="none" role="img" aria-label={`${last30} submissions in the last 30 days`}>
            <line x1="0" y1="79.5" x2="300" y2="79.5" stroke="#e3e7ee" />
            {days.map((d, i) => {
              const h = (d.n / maxDay) * 72;
              return (
                <rect key={d.d} x={i * 10 + 1.5} y={79 - h} width={7} height={Math.max(h, d.n ? 2 : 0)} rx={1.5} fill={i === 29 ? "#eabb13" : "#12466f"}>
                  <title>{`${d.d}: ${d.n}`}</title>
                </rect>
              );
            })}
          </svg>
          <div className="flex small muted" style={{ justifyContent: "space-between" }}>
            <span>{new Date(days[0].d).toLocaleDateString("en-GB", { timeZone: "UTC", day: "numeric", month: "short" })}</span>
            <span>Today</span>
          </div>
        </div>
      </div>

      <h2 className="c-section-title">Who is applying</h2>
      <div className="c-grid c-cols-3">
        <div className="c-card">
          <div className="c-card-h"><h2>Country of residence</h2></div>
          <div className="c-card-b"><Bars rows={countries.rows.map((r) => ({ label: r.label ?? "Not given", n: Number(r.n) }))} /></div>
        </div>
        <div className="c-card">
          <div className="c-card-h"><h2>Programme</h2></div>
          <div className="c-card-b"><Bars rows={majors.rows.map((r) => ({ label: r.label ?? "Not given", n: Number(r.n) }))} /></div>
        </div>
        <div className="c-card">
          <div className="c-card-h"><h2>Household income</h2></div>
          <div className="c-card-b"><Bars rows={incomes.rows.map((r) => ({ label: r.label ?? "Not given", n: Number(r.n) }))} /></div>
        </div>
      </div>

      <h2 className="c-section-title">Recent activity</h2>
      <div className="c-card">
        {feed.rows.length ? (
          <ul className="c-feed">
            {feed.rows.map((r, i) => (
              <li key={i}>
                <span>
                  <b>{r.name ?? "System"}</b> {actionLabels[r.action] ?? r.action} {r.target && <span className="mono">{r.target}</span>}
                </span>
                <time dateTime={r.created_at}>{when(r.created_at)}</time>
              </li>
            ))}
          </ul>
        ) : (
          <p className="c-empty">No activity yet</p>
        )}
      </div>
    </>
  );
}
