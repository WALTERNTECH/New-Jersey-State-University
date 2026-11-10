import Link from "next/link";
import { db } from "@/lib/db";
import { canDecide, requireStaffPage } from "@/lib/staff";
import { fullName } from "@/lib/committee";
import { programme } from "@/lib/content";
import { fmtDate } from "@/lib/client";
import { ConfirmReported } from "@/components/committee/AllowanceActions";

export const metadata = { title: "Arrivals" };
export const dynamic = "force-dynamic";

type Arrival = { arrival_date: string; mode: string; arrival_point: string; carrier: string; contact_name: string; contact_phone: string; contact_relationship: string };

export default async function Arrivals({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const me = await requireStaffPage();
  const view = (await searchParams).view === "enrolled" ? "enrolled" : "accepted";
  const q = await db();
  const { rows } = await q.query<{ id: string; reference: string; data: Record<string, string>; arrival: Arrival | null; offer_reply_at: string; enrolled_at: string | null; email: string }>(
    `select a.id, a.reference, a.data, a.arrival, a.offer_reply_at, a.enrolled_at, p.email
     from applications a join applicants p on p.id = a.applicant_id where a.status = $1
     order by ${view === "enrolled" ? "a.enrolled_at desc" : "(a.arrival->>'arrival_date') asc nulls last"}`,
    [view],
  );
  const counts = await q.query<{ status: string; n: number }>("select status, count(*)::int as n from applications where status in ('accepted', 'enrolled') group by status");
  const n = (s: string) => Number(counts.rows.find((r) => r.status === s)?.n ?? 0);
  const decide = canDecide(me);
  return (
    <>
      <div className="c-head">
        <div>
          <h1>Arrivals and enrolment</h1>
          <p>Scholars who have accepted their offer. Confirm each scholar in person when they report to campus in {programme.arrival}; this enrols them.</p>
        </div>
      </div>
      <div className="c-card">
        <nav className="c-tabs" aria-label="View">
          <Link href="/committee/arrivals" aria-current={view === "accepted" ? "page" : undefined}>
            Due to report <span className="c-count">{n("accepted")}</span>
          </Link>
          <Link href="/committee/arrivals?view=enrolled" aria-current={view === "enrolled" ? "page" : undefined}>
            Enrolled <span className="c-count">{n("enrolled")}</span>
          </Link>
        </nav>
        {rows.length ? (
          <table className="c-table">
            <thead>
              <tr>
                <th>Scholar</th>
                <th>{view === "enrolled" ? "Enrolled" : "Arrival"}</th>
                <th>Travel</th>
                <th>Emergency contact</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} style={{ cursor: "default" }}>
                  <td>
                    <Link href={`/committee/applications/${r.id}`} style={{ fontWeight: 600, color: "var(--ink)", textDecoration: "none" }}>{fullName(r.data)}</Link>
                    <span className="sub">{r.reference} · {r.data.residence}</span>
                  </td>
                  <td data-label={view === "enrolled" ? "Enrolled" : "Arrival"}>
                    {view === "enrolled" ? fmtDate(r.enrolled_at) : r.arrival ? fmtDate(r.arrival.arrival_date) : <span className="c-st submitted">Plan not submitted</span>}
                  </td>
                  <td data-label="Travel">{r.arrival ? `${r.arrival.mode} · ${r.arrival.arrival_point}${r.arrival.carrier ? ` · ${r.arrival.carrier}` : ""}` : "—"}</td>
                  <td data-label="Emergency contact">{r.arrival ? `${r.arrival.contact_name} (${r.arrival.contact_relationship}) ${r.arrival.contact_phone}` : "—"}</td>
                  <td data-label="">{view === "accepted" && decide && <ConfirmReported id={r.id} name={fullName(r.data)} />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="c-empty">{view === "enrolled" ? "No scholars have enrolled yet." : "No admitted scholars are due to report."}</p>
        )}
      </div>
    </>
  );
}
