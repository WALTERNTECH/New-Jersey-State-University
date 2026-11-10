import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/Chrome";
import { RevealObserver } from "@/components/Motion";
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
            <span className="eyebrow light anim">Financial Aid</span>
            <h1 className="anim" style={{ animationDelay: "0.1s" }}>
              Allowances for Access Scholars
            </h1>
            <p className="anim" style={{ animationDelay: "0.2s" }}>
              In addition to full tuition, required fees, housing and dining, the {programme.name} provides a comprehensive set of allowances so that each
              scholar can study, live and travel without financial hardship. Allowance amounts are reviewed annually.
            </p>
            <div className="phase-key anim" style={{ animationDelay: "0.3s" }}>
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
              <div className="acat-head" data-reveal>
                <div>
                  <h2>{c.title}</h2>
                  <p className="muted mt8">{c.intro}</p>
                </div>
              </div>
              <div className="acards">
                {allowances
                  .filter((a) => a.category === c.id)
                  .map((a, i) => (
                    <article className="acard" key={a.slug} id={a.slug} data-reveal style={{ transitionDelay: `${i * 80}ms` }}>
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
            <div className="section-head" data-reveal>
              <span className="eyebrow">Process</span>
              <h2>How allowances are requested</h2>
              <p className="lede">Allowance requests open in stages, so that support reaches admitted scholars only, at the moment it is needed.</p>
            </div>
            <div className="howgrid" data-reveal>
              <div>
                <b>In the application</b>
                <p>Candidates indicate their housing preference, whether they require the technology allowance, and whether they will need a U.S. student visa.</p>
              </div>
              <div>
                <b>On admission</b>
                <p>Once an offer of admission is accepted, the portal opens requests for travel, the settling-in grant, visa fee reimbursement and off-campus housing.</p>
              </div>
              <div>
                <b>At registration</b>
                <p>Scholars report to campus in person. The Registrar confirms enrolment and the Bursar arranges disbursement; bank details are never requested online.</p>
              </div>
              <div>
                <b>While enrolled</b>
                <p>Enrolled scholars may request the summer research stipend, the study abroad allowance and emergency hardship grants at any time.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="cta-band">
          <div className="wrap" data-reveal>
            <div>
              <h2>Begin your application to the Access Scholarship.</h2>
              <p>The application deadline is {programme.deadline} at 11:59 p.m. Eastern Time.</p>
            </div>
            <Link href="/apply" className="btn btn-gold">
              Begin your application
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
      <RevealObserver />
    </>
  );
}
