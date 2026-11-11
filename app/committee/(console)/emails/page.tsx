import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { canDecide, requireStaffPage } from "@/lib/staff";
import { emailConfigured } from "@/lib/email";
import { emailKindLabels } from "@/lib/email-templates";
import { when } from "@/components/committee/bits";
import { ResendEmail } from "@/components/committee/Workflow";

export const metadata = { title: "Email log" };
export const dynamic = "force-dynamic";

const tabs = [
  { id: "all", label: "All" },
  { id: "unsent", label: "Not sent" },
  { id: "sent", label: "Sent" },
];
const statusText: Record<string, string> = { sent: "Sent", skipped: "Not sent", failed: "Failed", queued: "Sending" };

export default async function Emails({ searchParams }: { searchParams: Promise<{ view?: string; q?: string }> }) {
  const me = await requireStaffPage();
  if (!canDecide(me)) redirect("/committee");
  const sp = await searchParams;
  const view = tabs.some((t) => t.id === sp.view) ? sp.view! : "all";
  const where: string[] = [];
  const args: unknown[] = [];
  if (view === "unsent") where.push("e.status in ('failed', 'skipped')");
  if (view === "sent") where.push("e.status = 'sent'");
  if (sp.q?.trim()) {
    args.push(`%${sp.q.trim().replace(/[%_\\]/g, (m) => "\\" + m)}%`);
    where.push(`(e.to_email ilike $${args.length} or a.reference ilike $${args.length})`);
  }
  const q = await db();
  const [{ rows }, counts] = await Promise.all([
    q.query<{ id: string; to_email: string; kind: string; subject: string; status: string; error: string | null; attempts: number; created_at: string; sent_at: string | null; app_id: string | null; reference: string | null }>(
      `select e.id, e.to_email, e.kind, e.subject, e.status, e.error, e.attempts, e.created_at, e.sent_at, a.id as app_id, a.reference
       from emails e left join applications a on a.applicant_id = e.applicant_id
       ${where.length ? `where ${where.join(" and ")}` : ""} order by e.created_at desc limit 200`,
      args,
    ),
    q.query<{ status: string; n: number }>("select status, count(*)::int as n from emails group by status"),
  ]);
  const n = (s: string[]) => counts.rows.filter((r) => s.includes(r.status)).reduce((a, r) => a + Number(r.n), 0);
  const unsent = n(["failed", "skipped"]);
  const configured = emailConfigured();

  return (
    <>
      <div className="c-head">
        <div>
          <h1>Email log</h1>
          <p>Every message the portal sends to applicants, newest first.</p>
        </div>
      </div>

      {configured ? (
        <div className="c-banner ok">
          <span>Email is connected. Messages are sent automatically at each stage.</span>
          {unsent > 0 && <ResendEmail all />}
        </div>
      ) : (
        <div className="c-banner">
          <span>
            Email is not set up yet, so messages are recorded here but not delivered. Once Resend is connected, use “Send all unsent emails” to deliver
            the {unsent} waiting.
          </span>
          <ResendEmail all disabled />
        </div>
      )}

      <div className="c-card">
        <nav className="c-tabs" aria-label="Status">
          {tabs.map((t) => (
            <Link key={t.id} href={`/committee/emails?view=${t.id}${sp.q ? `&q=${encodeURIComponent(sp.q)}` : ""}`} aria-current={t.id === view ? "page" : undefined}>
              {t.label} <span className="c-count">{t.id === "all" ? n(["sent", "failed", "skipped", "queued"]) : t.id === "sent" ? n(["sent"]) : unsent}</span>
            </Link>
          ))}
        </nav>
        {rows.length ? (
          <table className="c-table">
            <thead>
              <tr>
                <th>Recipient</th>
                <th>Message</th>
                <th>Status</th>
                <th>When</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} style={{ cursor: "default" }}>
                  <td>
                    <span style={{ fontWeight: 600 }}>{r.to_email}</span>
                    {r.app_id && (
                      <Link className="sub mono" href={`/committee/applications/${r.app_id}`} style={{ display: "block" }}>
                        {r.reference}
                      </Link>
                    )}
                  </td>
                  <td data-label="Message">
                    {emailKindLabels[r.kind] ?? r.kind}
                    <span className="sub">{r.subject}</span>
                  </td>
                  <td data-label="Status">
                    <span className={`c-mail ${r.status}`}>{statusText[r.status] ?? r.status}</span>
                    {r.error && r.status !== "sent" && <span className="sub">{r.error}</span>}
                  </td>
                  <td data-label="When" className="muted">{when(r.sent_at ?? r.created_at)}</td>
                  <td data-label="">{configured && ["failed", "skipped"].includes(r.status) && r.kind !== "password_reset" && <ResendEmail id={r.id} />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="c-empty">No emails {view === "unsent" ? "waiting to be sent" : "yet"}.</p>
        )}
      </div>
    </>
  );
}
