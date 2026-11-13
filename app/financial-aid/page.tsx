import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/Chrome";
import { allowanceCategories, allowances, phaseLabels, programme, type AllowancePhase } from "@/lib/content";

export const metadata = {
  title: "Financial Aid",
  description: `The allowances provided with the ${programme.name}: course materials, technology, living costs, housing, travel, health insurance, research, study abroad and emergency support.`,
};

const phaseOrder: AllowancePhase[] = ["automatic", "application", "admitted", "enrolled"];

function cta(phase: AllowancePhase, slug: string) {
  if (phase === "automatic") return <span className="small muted">No request required</span>;
  if (phase === "application")
    return (
      <Link className="small" href="/apply">
        Indicate in your application
      </Link>
    );
  return (
    <Link className="btn btn-ghost btn-sm" href={`/portal/allowances/${slug}`}>
      {phase === "admitted" ? "Request (admitted scholars)" : "Request (enrolled scholars)"}
    </Link>
  );
}

export default function FinancialAid() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <section className="pagehero">
          <div className="wrap">
            <span className="kicker light">Financial Aid</span>
            <h1>Allowances for Access Scholars</h1>
            <p>Paid by bank transfer to the account given in the application, in addition to full tuition, fees, housing and dining.</p>
            <div className="phase-key">
              {phaseOrder.map((p) => (
                <div key={p}>
                  <b>{phaseLabels[p].label}</b>
                  <span>{phaseLabels[p].detail}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {allowanceCategories.map((c) => (
          <section className="acat" key={c.id} id={c.id}>
            <div className="wrap">
              <div className="acat-head">
                <h2>{c.title}</h2>
              </div>
              <div className="acards">
                {allowances
                  .filter((a) => a.category === c.id)
                  .map((a) => (
                    <article className="acard" key={a.slug} id={a.slug}>
                      <span className={`phase ${a.phase}`}>{phaseLabels[a.phase].label}</span>
                      <h3>{a.title}</h3>
                      <div className="amt">
                        <b>{a.amount}</b>
                        <span>{a.cadence}</span>
                      </div>
                      <p>{a.coverage}</p>
                      {a.who && <p className="who">Eligible: {a.who}</p>}
                      {a.documents?.length ? (
                        <p className="who">Documents required: {a.documents.filter((d) => d.required).map((d) => d.label.toLowerCase()).join("; ")}.</p>
                      ) : null}
                      <div className="foot">{cta(a.phase, a.slug)}</div>
                    </article>
                  ))}
              </div>
            </div>
          </section>
        ))}

        <section className="section" id="how">
          <div className="wrap">
            <div className="section-head">
              <h2>How allowances are paid</h2>
            </div>
            <div className="howgrid">
              <div>
                <b>Apply</b>
                <p>Housing, technology, visa needs and bank account are given in the application.</p>
              </div>
              <div>
                <b>Accept your offer</b>
                <p>Travel, settling-in, visa and off-campus housing requests open.</p>
              </div>
              <div>
                <b>Approval</b>
                <p>The Office approves each request.</p>
              </div>
              <div>
                <b>Payment</b>
                <p>Approved allowances are paid to your bank account.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="cta-band">
          <div className="wrap">
            <h2>
              Applications close {programme.deadline}, {programme.deadlineTime}.
            </h2>
            <Link href="/apply" className="btn btn-gold btn-lg">
              Start your application
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
