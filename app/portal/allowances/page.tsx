import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/Chrome";
import { requireApplicant } from "@/lib/auth";
import { applicationFor } from "@/lib/application";
import { canRequest, requestsFor, requestStatusLabels } from "@/lib/allowances";
import { allowanceCategories, allowances, phaseLabels } from "@/lib/content";

export const metadata = { title: "Allowances", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function PortalAllowances() {
  const me = await requireApplicant("/portal/allowances");
  const app = await applicationFor(me.id);
  if (!app) redirect("/apply");
  const reqs = await requestsFor(app.id);
  const decided = reqs.filter((r) => r.status !== "draft");
  const admitted = ["accepted", "enrolled"].includes(app.status);

  return (
    <>
      <SiteHeader portal />
      <main id="main">
        <div className="portalbar">
          <div className="wrap">
            <div>
              <span className="eyebrow">Financial Aid</span>
              <h1 className="mt8">Your allowances</h1>
            </div>
            <Link className="btn btn-ghost btn-sm" href="/portal">Back to dashboard</Link>
          </div>
        </div>
        <div className="wrap" style={{ paddingBottom: 80 }}>
          {!admitted && (
            <div className="alert alert-info mt32">
              <span>
                Allowance requests open to admitted scholars once the offer of admission has been accepted.
                {app.status === "awarded" ? " Please reply to your offer from the dashboard." : ""}
              </span>
            </div>
          )}
          {allowanceCategories.map((c) => (
            <section className="acat" key={c.id} style={{ paddingTop: 40 }}>
              <div className="acat-head">
                <h2>{c.title}</h2>
              </div>
              <div className="acards">
                {allowances
                  .filter((a) => a.category === c.id)
                  .map((a) => {
                    const mine = decided.filter((r) => r.slug === a.slug);
                    const allowed = canRequest(a, app.status, app.data, decided);
                    const fromApp =
                      a.slug === "laptop" ? (app.data.laptop === "Yes" ? "Requested in your application" : "Not requested in your application") : null;
                    return (
                      <article className="acard" key={a.slug}>
                        <span className={`phase ${a.phase}`}>{phaseLabels[a.phase].label}</span>
                        <h3>{a.title}</h3>
                        <div className="amt">
                          <b>{a.amount}</b>
                          <span>{a.cadence}</span>
                        </div>
                        {mine.length > 0 && (
                          <ul className="small" style={{ margin: 0, paddingLeft: 18, color: "var(--ink-2)" }}>
                            {mine.map((r) => (
                              <li key={r.id}>
                                {requestStatusLabels[r.status]}
                                {r.data.journey ? ` · ${r.data.journey}` : ""}
                                {r.decision_note ? ` · “${r.decision_note}”` : ""}
                              </li>
                            ))}
                          </ul>
                        )}
                        <div className="foot">
                          {a.phase === "automatic" ? (
                            <span className="small muted">{admitted ? "Included in your award" : phaseLabels.automatic.detail}</span>
                          ) : fromApp ? (
                            <span className="small muted">{fromApp}</span>
                          ) : allowed.ok ? (
                            <Link className="btn btn-primary btn-sm" href={`/portal/allowances/${a.slug}`}>
                              {mine.length ? "Make another request" : "Request"}
                            </Link>
                          ) : (
                            <span className="lock">🔒 {allowed.reason}</span>
                          )}
                        </div>
                      </article>
                    );
                  })}
              </div>
            </section>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
