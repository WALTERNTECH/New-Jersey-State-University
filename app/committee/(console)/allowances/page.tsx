import Link from "next/link";
import { db } from "@/lib/db";
import { requireStaffPage } from "@/lib/staff";
import { fullName } from "@/lib/committee";
import { allowanceBySlug } from "@/lib/content";
import { requestStatusLabels } from "@/lib/allowances";
import { when } from "@/components/committee/bits";

export const metadata = { title: "Allowance requests" };
export const dynamic = "force-dynamic";

const tabs = [
  { id: "submitted", label: "Awaiting decision" },
  { id: "approved", label: "Approved, to disburse" },
  { id: "disbursed", label: "Disbursed" },
  { id: "declined", label: "Declined" },
];

const requested = (d: Record<string, string>) =>
  d.amount ? `$${Number(d.amount).toLocaleString("en-US")}` : d.amount_paid ? `$${Number(d.amount_paid).toLocaleString("en-US")}` : d.monthly_rent ? `$${Number(d.monthly_rent).toLocaleString("en-US")}/month` : "—";

export default async function AllowanceRequests({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireStaffPage();
  const sp = await searchParams;
  const status = tabs.some((t) => t.id === sp.status) ? sp.status! : "submitted";
  const q = await db();
  const [{ rows }, counts] = await Promise.all([
    q.query<{ id: string; slug: string; status: string; data: Record<string, string>; submitted_at: string; reference: string; app: Record<string, string> }>(
      `select r.id, r.slug, r.status, r.data, r.submitted_at, a.reference, a.data as app
       from allowance_requests r join applications a on a.id = r.application_id
       where r.status = $1 order by r.submitted_at ${status === "submitted" ? "asc" : "desc"} limit 200`,
      [status],
    ),
    q.query<{ status: string; n: number }>("select status, count(*)::int as n from allowance_requests where status <> 'draft' group by status"),
  ]);
  const n = (s: string) => Number(counts.rows.find((r) => r.status === s)?.n ?? 0);
  return (
    <>
      <div className="c-head">
        <div>
          <h1>Allowance requests</h1>
          <p>Requests from admitted and enrolled scholars. Bank details are never collected online; the Bursar arranges payment at registration.</p>
        </div>
      </div>
      <div className="c-card">
        <nav className="c-tabs" aria-label="Request status">
          {tabs.map((t) => (
            <Link key={t.id} href={`/committee/allowances?status=${t.id}`} aria-current={t.id === status ? "page" : undefined}>
              {t.label} <span className="c-count">{n(t.id)}</span>
            </Link>
          ))}
        </nav>
        {rows.length ? (
          <table className="c-table">
            <thead>
              <tr>
                <th>Scholar</th>
                <th>Allowance</th>
                <th>Requested</th>
                <th>Reference</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} style={{ position: "relative" }}>
                  <td>
                    <a className="rowlink" href={`/committee/allowances/${r.id}`}>{fullName(r.app)}</a>
                    <span className="sub">{r.app.residence}</span>
                  </td>
                  <td data-label="Allowance">{allowanceBySlug(r.slug)?.title ?? r.slug}</td>
                  <td data-label="Requested" className="num">{requested(r.data)}</td>
                  <td data-label="Reference" className="mono">{r.reference}</td>
                  <td data-label="Submitted" className="muted">{when(r.submitted_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="c-empty">No requests {requestStatusLabels[status]?.toLowerCase() === "under review" ? "awaiting a decision" : `marked ${requestStatusLabels[status]?.toLowerCase()}`}.</p>
        )}
      </div>
    </>
  );
}
