import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { canDecide, requireStaffPage } from "@/lib/staff";
import { fullName } from "@/lib/committee";
import { allowanceBySlug } from "@/lib/content";
import { requestStatusLabels } from "@/lib/allowances";
import { fmtDate, fmtSize } from "@/lib/client";
import { StatusChip, when } from "@/components/committee/bits";
import { AllowanceDecision } from "@/components/committee/AllowanceActions";

export const metadata = { title: "Allowance request" };
export const dynamic = "force-dynamic";

export default async function AllowanceRequest({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireStaffPage();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const q = await db();
  const { rows } = await q.query<{
    id: string; slug: string; status: string; data: Record<string, string>; decision_note: string | null; submitted_at: string; decided_at: string | null;
    app_id: string; reference: string; app_status: string; app: Record<string, string>; decider: string | null;
  }>(
    `select r.id, r.slug, r.status, r.data, r.decision_note, r.submitted_at, r.decided_at, a.id as app_id, a.reference, a.status as app_status, a.data as app, s.name as decider
     from allowance_requests r join applications a on a.id = r.application_id left join staff s on s.id = r.decided_by
     where r.id = $1 and r.status <> 'draft'`,
    [id],
  );
  const r = rows[0];
  if (!r) notFound();
  const a = allowanceBySlug(r.slug);
  const files = await q.query<{ id: string; doc_key: string; filename: string; size: number; created_at: string }>(
    "select id, doc_key, filename, size, created_at from allowance_files where request_id = $1 order by created_at",
    [id],
  );
  return (
    <>
      <div className="c-head">
        <div>
          <p className="flex small" style={{ marginBottom: 6 }}>
            <Link href="/committee/allowances">Allowance requests</Link>
            <span className="muted">/</span>
            <span className="mono">{r.reference}</span>
          </p>
          <h1>{a?.title ?? r.slug}</h1>
          <p className="flex" style={{ marginTop: 8 }}>
            <span className={`c-st ${r.status === "submitted" ? "submitted" : r.status === "declined" ? "not_selected" : "awarded"}`}>{requestStatusLabels[r.status]}</span>
            <span>
              <Link href={`/committee/applications/${r.app_id}`}>{fullName(r.app)}</Link> · <StatusChip status={r.app_status} />
            </span>
          </p>
        </div>
      </div>
      <div className="c-split">
        <div className="c-grid">
          <section className="c-card">
            <div className="c-card-h">
              <h2>Request</h2>
              <span className="muted">Submitted {fmtDate(r.submitted_at, true)}</span>
            </div>
            <dl className="c-dl">
              {(a?.fields ?? []).map((f) => (
                <div key={f.name} style={{ display: "contents" }}>
                  <dt>{f.label}</dt>
                  <dd style={{ whiteSpace: "pre-wrap" }}>{r.data[f.name] || <span className="muted">—</span>}</dd>
                </div>
              ))}
              <dt>Allowance terms</dt>
              <dd>{a ? `${a.amount} ${a.cadence}. ${a.coverage}` : "—"}</dd>
            </dl>
          </section>
          <section className="c-card">
            <div className="c-card-h">
              <h2>Supporting documents</h2>
              <span className="muted">Every view is logged</span>
            </div>
            {(a?.documents ?? []).length ? (
              a!.documents!.map((d) => {
                const f = files.rows.find((x) => x.doc_key === d.key);
                return (
                  <div className="c-doc" key={d.key}>
                    <div className="k">
                      <b>{d.label}</b>
                      <span>{f ? `${f.filename} · ${fmtSize(f.size)} · ${when(f.created_at)}` : d.required ? "Missing" : "Not provided"}</span>
                    </div>
                    {f && <a className="btn btn-ghost btn-sm" href={`/api/committee/allowance-files/${f.id}`} target="_blank" rel="noopener">Open</a>}
                  </div>
                );
              })
            ) : (
              <p className="c-empty">No documents are required for this allowance.</p>
            )}
          </section>
        </div>
        <aside className="c-grid">
          <section className="c-card">
            <div className="c-card-h"><h2>Decision</h2></div>
            <div className="c-card-b stack" style={{ gap: 12 }}>
              {r.decided_at && (
                <p className="small muted">
                  {requestStatusLabels[r.status]} by {r.decider ?? "the committee"} on {fmtDate(r.decided_at, true)}
                  {r.decision_note && <><br />“{r.decision_note}”</>}
                </p>
              )}
              <AllowanceDecision id={r.id} status={r.status} canDecide={canDecide(me)} />
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}
