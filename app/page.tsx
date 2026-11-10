import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/Chrome";
import { BackgroundVideo, CountUp, RevealObserver } from "@/components/Motion";
import { allowanceCategories, allowances, eligibility, faqs, pillars, programme, timeline } from "@/lib/content";

// Annual value of the allowances paid every year, for the figure in the "Beyond tuition" section.
const annual = [1500, 4500, 5500, 3500];

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <section className="hero2" aria-labelledby="hero-title">
          <div className="hero2-bg" aria-hidden>
            <span className="rays" />
            <span className="glow" />
          </div>
          <BackgroundVideo className="hero2-mobile-video" src="/media/hero-2.mp4" poster="/media/hero-2.jpg" />
          <div className="wrap hero2-grid">
            <div className="hero2-copy">
              <span className="eyebrow light anim" style={{ animationDelay: "0.05s" }}>
                {programme.office}
              </span>
              <h1 id="hero-title" className="anim" style={{ animationDelay: "0.15s" }}>
                A complete education,
                <br />
                <em>fully funded.</em>
              </h1>
              <p className="anim" style={{ animationDelay: "0.3s" }}>
                The {programme.name} meets the full cost of attendance for four years of undergraduate study, for students of exceptional promise whose
                families are unable to meet the cost of a university education.
              </p>
              <div className="actions anim" style={{ animationDelay: "0.45s" }}>
                <Link href="/apply" className="btn btn-gold">
                  Begin your application
                </Link>
                <Link href="/financial-aid" className="btn btn-ghost-light">
                  Explore financial aid
                </Link>
              </div>
              <dl className="hero2-facts anim" style={{ animationDelay: "0.6s" }}>
                <div>
                  <dt>Duration</dt>
                  <dd>Four years</dd>
                </div>
                <div>
                  <dt>Award</dt>
                  <dd>Full cost of attendance</dd>
                </div>
                <div>
                  <dt>Deadline</dt>
                  <dd>{programme.deadline}</dd>
                </div>
              </dl>
            </div>
            <div className="hero2-media" aria-hidden>
              <figure className="vframe one">
                <BackgroundVideo src="/media/hero-1.mp4" poster="/media/hero-1.jpg" />
              </figure>
              <figure className="vframe two">
                <BackgroundVideo src="/media/hero-2.mp4" poster="/media/hero-2.jpg" delay={600} />
              </figure>
              <span className="vring" />
            </div>
          </div>
          <a href="#statement" className="scrollcue" aria-label="Scroll to content">
            <span />
          </a>
        </section>

        <div className="ticker" aria-hidden>
          <div className="ticker-track">
            {Array.from({ length: 2 }).map((_, k) => (
              <span key={k}>
                {programme.cycle} <i>✦</i> Applications open {programme.opens} <i>✦</i> Deadline {programme.deadline} <i>✦</i> Decisions by {programme.decisions} <i>✦</i>{" "}
                Matriculation {programme.startTerm} <i>✦</i>{" "}
              </span>
            ))}
          </div>
        </div>

        <section className="section statement" id="statement">
          <div className="wrap-narrow center" data-reveal>
            <span className="rule" />
            <p className="statement-text">
              A student’s capacity to pay should never determine the reach of their ambition. The Access Scholarship exists so that the most promising
              students, wherever they are in the world, can pursue a university education without financial barrier.
            </p>
            <p className="statement-by">The Scholarship Committee, {programme.university}</p>
          </div>
        </section>

        <section className="section alt" id="award">
          <div className="wrap">
            <div className="section-head" data-reveal>
              <span className="eyebrow">The Award</span>
              <h2>Four years. The full cost of attendance.</h2>
              <p className="lede">Each award is renewed annually for up to eight semesters while the scholar remains enrolled full-time and in good academic standing.</p>
            </div>
            <div className="grid4">
              {pillars.map((c, i) => (
                <article className="cover" key={c.title} data-reveal style={{ transitionDelay: `${i * 90}ms` }}>
                  <span className="num">{String(i + 1).padStart(2, "0")}</span>
                  <h3>{c.title}</h3>
                  <p>{c.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section beyond">
          <div className="wrap">
            <div className="beyond-grid">
              <div data-reveal>
                <span className="eyebrow light">Beyond tuition</span>
                <h2>
                  More than <CountUp value={annual.reduce((a, b) => a + b, 0)} prefix="$" /> in allowances every year
                </h2>
                <p>
                  Alongside tuition, housing and dining, every scholar receives allowances for course materials, personal expenses, health insurance and
                  travel, with further support for technology, research, study abroad and unforeseen hardship.
                </p>
                <Link className="btn btn-gold mt32" href="/financial-aid">
                  View all {allowances.length} allowances
                </Link>
              </div>
              <ul className="beyond-list">
                {allowanceCategories.map((c, i) => (
                  <li key={c.id} data-reveal style={{ transitionDelay: `${i * 90}ms` }}>
                    <span className="k">{String(i + 1).padStart(2, "0")}</span>
                    <div>
                      <b>{c.title}</b>
                      <p>{allowances.filter((a) => a.category === c.id).map((a) => a.title).join(" · ")}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="section" id="eligibility">
          <div className="wrap split">
            <div data-reveal>
              <span className="eyebrow">Eligibility</span>
              <h2 className="h2">Who may apply</h2>
              <p className="lede">
                The Access Scholarship is open to candidates of every nationality. The Committee seeks students of intellectual promise and strong character
                for whom the cost of university would otherwise be prohibitive.
              </p>
              <Link href="/apply" className="btn btn-primary mt32">
                Confirm your eligibility
              </Link>
            </div>
            <ul className="checklist">
              {eligibility.map((e, i) => (
                <li key={e} data-reveal style={{ transitionDelay: `${i * 70}ms` }}>
                  <i className="tick">✓</i>
                  <span>{e}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="section alt" id="how">
          <div className="wrap">
            <div className="section-head" data-reveal>
              <span className="eyebrow">The application</span>
              <h2>Applying to the Access Scholarship</h2>
              <p className="lede">The application is completed entirely online through the applicant portal.</p>
            </div>
            <div className="steps3">
              {[
                ["Confirm eligibility", "Answer four brief questions and create your applicant account in a single step."],
                ["Complete the application", "Seven concise sections, two personal statements and two supporting documents. Your progress is saved automatically."],
                ["Follow your application", "The portal shows each stage of the Committee’s review, from submission through interview to the admission decision."],
              ].map(([t, b], i) => (
                <div key={t} data-reveal style={{ transitionDelay: `${i * 90}ms` }}>
                  <h3>{t}</h3>
                  <p>{b}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="dates">
          <div className="wrap">
            <div className="section-head" data-reveal>
              <span className="eyebrow">Key dates</span>
              <h2>{programme.cycle} admission cycle</h2>
            </div>
            <ol className="timeline" data-reveal>
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

        <section className="section alt" id="faq">
          <div className="wrap split">
            <div data-reveal>
              <span className="eyebrow">Questions</span>
              <h2 className="h2">Frequently asked questions</h2>
              <p className="lede">Further guidance for candidates and their families.</p>
            </div>
            <div className="faq" data-reveal>
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
          <div className="wrap" data-reveal>
            <div>
              <h2>Applications for {programme.startTerm} are now open.</h2>
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
