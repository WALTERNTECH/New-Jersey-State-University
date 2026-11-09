import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/Chrome";
import { coverage, eligibility, faqs, programme, timeline } from "@/lib/content";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <section className="hero">
          <div className="wrap">
            <div>
              <span className="eyebrow">{programme.name} · {programme.cycle}</span>
              <h1>
                Four years of university, <em>fully funded.</em>
              </h1>
              <p className="lede">
                The {programme.name} covers tuition, housing, meals, books and a laptop for the whole of a bachelor’s degree at {programme.university}, for
                talented students whose families cannot afford university.
              </p>
              <div className="actions">
                <Link href="/apply" className="btn btn-primary">
                  Check eligibility and apply
                </Link>
                <Link href="#how" className="btn btn-ghost">
                  How applying works
                </Link>
              </div>
              <div className="assure">
                <span><i className="tick">✓</i> Free to apply</span>
                <span><i className="tick">✓</i> About 45 minutes</span>
                <span><i className="tick">✓</i> Saves as you go</span>
              </div>
            </div>
            <aside className="factcard" aria-label="Scholarship at a glance">
              <img className="crestbig" src="/crest.png" alt={`${programme.university} crest`} width={150} height={139} />
              <div className="univ">
                New Jersey State
                <small>University</small>
              </div>
              <div className="facts">
                <div>
                  <b>{programme.years} years</b>
                  <span>Bachelor’s degree</span>
                </div>
                <div>
                  <b>100%</b>
                  <span>Tuition and fees</span>
                </div>
                <div>
                  <b>$0</b>
                  <span>Application fee</span>
                </div>
                <div>
                  <b>{programme.deadline.replace(/ \d{4}$/, "")}</b>
                  <span>Deadline, {programme.deadline.slice(-4)}</span>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section className="section" id="coverage">
          <div className="wrap">
            <div className="section-head">
              <span className="eyebrow">What the scholarship covers</span>
              <h2>Everything you need to study, for all four years</h2>
              <p className="lede">Scholars keep their award for the full degree while they stay in good academic standing. There is nothing to repay.</p>
            </div>
            <div className="grid4">
              {coverage.map((c, i) => (
                <article className="cover" key={c.title}>
                  <span className="num">{String(i + 1).padStart(2, "0")}</span>
                  <h3>{c.title}</h3>
                  <p>{c.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section alt" id="eligibility">
          <div className="wrap split">
            <div>
              <span className="eyebrow">Eligibility</span>
              <h2 style={{ fontSize: "clamp(30px, 3.6vw, 42px)", margin: "14px 0" }}>Who can apply</h2>
              <p className="lede">
                The scholarship is for students with the ability and determination to succeed at university, and without the means to pay for it. Applicants from every
                country are welcome.
              </p>
              <Link href="/apply" className="btn btn-primary mt32">
                Check if you qualify
              </Link>
            </div>
            <ul className="checklist">
              {eligibility.map((e) => (
                <li key={e}>
                  <i className="tick">✓</i>
                  <span>{e}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="section" id="how">
          <div className="wrap">
            <div className="section-head">
              <span className="eyebrow">How applying works</span>
              <h2>One application, in three steps</h2>
              <p className="lede">No fees, no printing and no posting. Everything happens in your applicant portal.</p>
            </div>
            <div className="steps3">
              <div>
                <h3>Check eligibility</h3>
                <p>Answer four quick questions and create your account on the same screen. It takes about a minute.</p>
              </div>
              <div>
                <h3>Complete your application</h3>
                <p>Six short sections, two short essays and two documents. Every answer saves as you type, so you can stop and return from any device.</p>
              </div>
              <div>
                <h3>Track your decision</h3>
                <p>Once you submit, your portal shows where your application is at every stage, from review to interview to decision.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="section alt" id="dates">
          <div className="wrap">
            <div className="section-head">
              <span className="eyebrow">Key dates</span>
              <h2>The {programme.cycle} cycle</h2>
            </div>
            <ol className="timeline">
              {timeline.map((t) => (
                <li key={t.title}>
                  <span className="dot" />
                  <div className="when">{t.when}</div>
                  <h3>{t.title}</h3>
                  <p>{t.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="section" id="faq">
          <div className="wrap split">
            <div>
              <span className="eyebrow">Questions</span>
              <h2 style={{ fontSize: "clamp(30px, 3.6vw, 42px)", margin: "14px 0" }}>Before you apply</h2>
              <p className="lede">Answers to what applicants ask us most.</p>
            </div>
            <div className="faq">
              {faqs.map((f) => (
                <details key={f.q}>
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="cta-band">
          <div className="wrap">
            <div>
              <h2>Your place at {programme.university} could start here.</h2>
              <p>Applications for {programme.startTerm} close on {programme.deadline}.</p>
            </div>
            <Link href="/apply" className="btn btn-gold">
              Start your application
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
