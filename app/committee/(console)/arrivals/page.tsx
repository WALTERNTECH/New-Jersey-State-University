import Link from "next/link";
import { db } from "@/lib/db";
import { canDecide, requireStaffPage } from "@/lib/staff";
import { ENROL_KINDS_SQL, fullName } from "@/lib/committee";
import { programme } from "@/lib/content";
import { enrolmentDocs } from "@/lib/form";
import { fmtDate } from "@/lib/client";
import { ConfirmReported } from "@/components/committee/AllowanceActions";

export const metadata = { title: "Arrivals" };
export const dynamic = "force-dynamic";

type Arrival = { arrival_date: string; mode: string; arrival_point: string; carrier: string; contact_name: string; contact_phone: string; contact_relationship: string };
const REQUIRED = enrolmentDocs.filter((d) => d.required).map((d) => d.kind);
const REQUIRED_SQL = `(${REQUIRED.map((k) => `'${k}'`).join(", ")})`;

const views = [
  { id: "documents", label: "Documents to verify" },
  { id: "accepted", label: "Due to report" },
  { id: "enrolled", label: "Enrolled" },
];

export default async function Arrivals({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const me = await requireStaffPage();
  const raw = (await searchParams).view;
  const view = views.some((v) => v.id === raw) ? raw! : "accepted";
  const q = await db();
  const pendingSql = `(select count(*)::int from documents d where d.application_id = a.id and d.kind in ${ENROL_KINDS_SQL} and d.review = 'pending')`;
  const where =
    view === "enrolled" ? "a.status = 'enrolled'" :
    view === "documents" ? `a.status = 'accepted' and ${pendingSql} > 0` :
    "a.status = 'accepted'";
  const order =
    view === "enrolled" ? "a.enrolled_at desc" :
    view === "documents" ? "a.updated_at asc" :
    "(a.cleared_at is null), (a.arrival->>'arrival_date') asc nulls last";
  const [{ rows }, counts] = await Promise.all([
    q.query<{ id: string; reference: string; data: Record<string, string>; arrival: Arrival | null; enrolled_at: string | null; cleared_at: string | null; verified: number; pending: number }>(
      `select a.id, a.reference, a.data, a.arrival, a.enrolled_at, a.cleared_at,
         (select count(distinct d.kind)::int from documents d where d.application_id = a.id and d.kind in ${REQUIRED_SQL} and d.review = 'verified') as verified,
         ${pendingSql} as pending
       from applications a where ${where} order by ${order}`,
    ),
    q.query<{ documents: number; accepted: number; enrolled: number }>(
      `select count(*) filter (where a.status = 'accepted' and ${pendingSql} > 0)::int as documents,
              count(*) filter (where a.status = 'accepted')::int as accepted,
              count(*) filter (where a.status = 'enrolled')::int as enrolled
       from applications a where a.status in ('accepted', 'enrolled')`,
    ),
  ]);
  const c = counts.rows[0] as unknown as Record<string, number>;
  const decide = canDecide(me);

  return (
    <>
      <div className="c-head">
        <div>
          <h1>Arrivals and enrolment</h1>
          <p>
            Scholars who have accepted their offer. Verify their identification documents; each is cleared to report automatically once their documents and arrival
            plan are complete. Confirm each in person when they report in {programme.arrival}.
          </p>
        </div>
      </div>
      <div className="c-card">
        <nav className="c-tabs" aria-label="View">
          {views.map((v) => (
            <Link key={v.id} href={`/committee/arrivals?view=${v.id}`} aria-current={view === v.id ? "page" : undefined}>
              {v.label} <span className={`c-count${v.id === "documents" && Number(c[v.id]) > 0 ? " hot" : ""}`}>{Number(c[v.id] ?? 0)}</span>
            </Link>
          ))}
        </nav>
        {rows.length ? (
          <table className="c-table">
            <thead>
              <tr>
                <th>Scholar</th>
                <th>{view === "enrolled" ? "Enrolled" : "Documents"}</th>
                <th>Arrival</th>
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
                  <td data-label={view === "enrolled" ? "Enrolled" : "Documents"}>
                    {view === "enrolled" ? (
                      fmtDate(r.enrolled_at)
                    ) : r.cleared_at ? (
                      <span className="c-rv verified">Cleared {fmtDate(r.cleared_at)}</span>
                    ) : (
                      <>
                        {r.verified} of {REQUIRED.length} verified
                        {r.pending > 0 && <span className="sub">{r.pending} to check</span>}
                      </>
                    )}
                  </td>
                  <td data-label="Arrival">
                    {r.arrival ? (
                      <>
                        {fmtDate(r.arrival.arrival_date)}
                        <span className="sub">{r.arrival.mode} · {r.arrival.arrival_point}{r.arrival.carrier ? ` · ${r.arrival.carrier}` : ""}</span>
                      </>
                    ) : (
                      <span className="c-st submitted">Plan not submitted</span>
                    )}
                  </td>
                  <td data-label="Emergency contact">{r.arrival ? `${r.arrival.contact_name} (${r.arrival.contact_relationship}) ${r.arrival.contact_phone}` : "—"}</td>
                  <td data-label="">
                    {view !== "enrolled" &&
                      (r.cleared_at ? (
                        decide && <ConfirmReported id={r.id} name={fullName(r.data)} />
                      ) : r.pending > 0 ? (
                        <Link className="btn btn-primary btn-sm" href={`/committee/applications/${r.id}`}>Verify documents</Link>
                      ) : (
                        <span className="small muted">Waiting for the scholar</span>
                      ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="c-empty">
            {view === "enrolled" ? "No scholars have enrolled yet." : view === "documents" ? "No documents are waiting to be verified." : "No admitted scholars are due to report."}
          </p>
        )}
      </div>
    </>
  );
}
