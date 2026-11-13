import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/Chrome";
import AllowanceForm from "@/components/portal/AllowanceForm";
import { requireApplicant } from "@/lib/auth";
import { applicationFor } from "@/lib/application";
import { db } from "@/lib/db";
import { allowanceBySlug, canRequest, requestsFor, requestStatusLabels } from "@/lib/allowances";
import { phaseLabels } from "@/lib/content";
import { fmtDate } from "@/lib/client";
import { masked, paymentSummary } from "@/lib/payment";

export const metadata = { title: "Allowance request", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AllowanceRequestPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = allowanceBySlug(slug);
  if (!a) notFound();
  const me = await requireApplicant(`/portal/allowances/${slug}`);
  const app = await applicationFor(me.id);
  if (!app) redirect("/apply");
  const [reqs, pay] = await Promise.all([requestsFor(app.id), paymentSummary(app.id)]);
  const mine = reqs.filter((r) => r.slug === slug && r.status !== "draft");
  const draft = reqs.find((r) => r.slug === slug && r.status === "draft");
  const allowed = canRequest(a, app.status, app.data, reqs.filter((r) => r.status !== "draft"));
  let draftFiles: { doc_key: string; filename: string }[] = [];
  if (draft) {
    const q = await db();
    draftFiles = (await q.query<{ doc_key: string; filename: string }>("select doc_key, filename from allowance_files where request_id = $1", [draft.id])).rows;
  }

  return (
    <>
      <SiteHeader portal />
      <main id="main">
        <div className="portalbar">
          <div className="wrap">
            <div>
              <span className="kicker">{phaseLabels[a.phase].label}</span>
              <h1>{a.title}</h1>
            </div>
            <Link className="btn btn-ghost btn-sm" href="/portal/allowances">All allowances</Link>
          </div>
        </div>
        <div className="wrap dash">
          <div className="stack" style={{ gap: 28 }}>
            <section className="panel">
              <div className="panel-h">
                <h2>{allowed.ok ? "Your request" : "Not available"}</h2>
              </div>
              <div className="panel-b">
                {allowed.ok ? (
                  <AllowanceForm
                    slug={a.slug}
                    fields={a.fields ?? []}
                    documents={a.documents ?? []}
                    initial={draft?.data ?? {}}
                    existingFiles={draftFiles}
                  />
                ) : (
                  <div className="stack">
                    <p>{allowed.reason}</p>
                    <div>
                      <Link className="btn btn-primary btn-sm" href="/portal">Return to dashboard</Link>
                    </div>
                  </div>
                )}
              </div>
            </section>
            {mine.length > 0 && (
              <section className="panel">
                <div className="panel-h"><h2>Previous requests</h2></div>
                <ul className="secs">
                  {mine.map((r) => (
                    <li key={r.id} style={{ padding: "14px 24px", display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                      <span>
                        Submitted {fmtDate(r.submitted_at)}
                        {r.data.journey ? ` · ${r.data.journey}` : ""}
                        {r.decision_note && <span className="small muted" style={{ display: "block" }}>“{r.decision_note}”</span>}
                      </span>
                      <span className={`st${["approved", "disbursed"].includes(r.status) ? " done" : ""}`}>{requestStatusLabels[r.status]}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
          <aside className="stack" style={{ gap: 28 }}>
            <section className="panel">
              <div className="panel-b stack" style={{ gap: 10 }}>
                <div className="amt" style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
                  <b style={{ fontSize: 30, color: "var(--navy)" }}>{a.amount}</b>
                  <span className="muted small">{a.cadence}</span>
                </div>
                <p className="small" style={{ color: "var(--ink-2)" }}>{a.coverage}</p>
                {a.who && <p className="small muted">Eligible: {a.who}</p>}
              </div>
            </section>
            <section className="panel">
              <div className="panel-b small" style={{ color: "var(--ink-2)" }}>
                <b style={{ color: "var(--navy)" }}>Paid to</b>
                <p className="mt8">{masked(pay) || "The bank account in your payment details"}</p>
                <Link className="small" href="/portal#payh">
                  Change payment details
                </Link>
              </div>
            </section>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
