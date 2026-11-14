import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/Chrome";
import { BackgroundVideo } from "@/components/Motion";
import { ChevronIcon } from "@/components/Icons";
import { allowances, countryList, eligibility, faqs, levels, phaseLabels, pillars, programme, timeline } from "@/lib/content";

const howTo = [
  { title: "Check your eligibility", action: "Start", href: "/apply" },
  { title: "Create your account", action: "Create account", href: "/apply" },
  { title: "Complete the application", action: "Continue", href: "/portal/application" },
  { title: "Submit and follow your decision", action: "Open portal", href: "/portal" },
];

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <section className="hero" aria-labelledby="hero-title">
          <div className="wrap hero-grid">
            <div>
              <p className="kicker light">
                {programme.name} · {programme.cycle}
              </p>
              <h1 id="hero-title">A complete education, fully funded.</h1>
              <p className="hero-lede">Full tuition, housing, dining and allowances for bachelor’s, master’s and doctoral study at {programme.university}.</p>
              <div className="actions">
                <Link href="/apply" className="btn btn-gold btn-lg">
                  Start your application
                </Link>
                <Link href="/signin" className="btn btn-outline-light btn-lg">
                  Sign in
                </Link>
              </div>
            </div>
            <div className="hero-media" aria-hidden>
              <BackgroundVideo src="/media/hero-1.mp4" poster="/media/hero-1.jpg" />
            </div>
          </div>
        </section>

        <section className="facts-strip" aria-label="At a glance">
          <dl className="wrap facts-grid">
            <div>
              <dt>Award</dt>
              <dd>Full cost of attendance</dd>
            </div>
            <div>
              <dt>Degrees</dt>
              <dd>Bachelor’s, master’s, Ph.D.</dd>
            </div>
            <div>
              <dt>Deadline</dt>
              <dd>{programme.deadline}</dd>
            </div>
            <div>
              <dt>Open to</dt>
              <dd>6 countries</dd>
            </div>
          </dl>
        </section>

        <section className="section" id="award">
          <div className="wrap">
            <div className="section-head">
              <h2>The award</h2>
            </div>
            <div className="grid4">
              {pillars.map((c) => (
                <article className="cover" key={c.title}>
                  <h3>{c.title}</h3>
                  <p>{c.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section alt" id="levels">
          <div className="wrap">
            <div className="section-head">
              <h2>Levels of study</h2>
            </div>
            <ul className="levels">
              {levels.map((l) => (
                <li key={l.id}>
                  <Link href={`/apply?level=${l.id}`} className="level">
                    <span className="level-t">{l.label}</span>
                    <span className="level-d">
                      <b>Award length</b>
                      {l.duration}
                    </span>
                    <span className="level-d">
                      <b>Entry qualification</b>
                      {l.entry}
                    </span>
                    <span className="level-go">
                      Check your eligibility
                      <ChevronIcon />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="section" id="allowances">
          <div className="wrap">
            <div className="section-head flex" style={{ justifyContent: "space-between", maxWidth: "none" }}>
              <h2>Allowances</h2>
              <Link href="/financial-aid" className="btn btn-outline">
                Financial aid details
              </Link>
            </div>
            <table className="dtable">
              <thead>
                <tr>
                  <th>Allowance</th>
                  <th>How it is paid</th>
                  <th className="num">Amount</th>
                </tr>
              </thead>
              <tbody>
                {allowances.map((a) => (
                  <tr key={a.slug}>
                    <td>
                      <b>{a.title}</b>
                    </td>
                    <td>{phaseLabels[a.phase].label}</td>
                    <td className="num">
                      {a.amount}
                      <small>{a.cadence}</small>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="section alt" id="eligibility">
          <div className="wrap split">
            <div>
              <h2 className="h2">Eligibility</h2>
              <p className="lede">Open to citizens and residents of {countryList}.</p>
              <Link href="/apply" className="btn btn-primary mt24">
                Check your eligibility
              </Link>
            </div>
            <ul className="checklist">
              {eligibility.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="section" id="how">
          <div className="wrap">
            <div className="section-head">
              <h2>How to apply</h2>
            </div>
            <ol className="steps4">
              {howTo.map((s, i) => (
                <li key={s.title}>
                  <Link href={s.href} className="step">
                    <span className="step-n">{i + 1}</span>
                    <span className="step-t">{s.title}</span>
                    <span className="step-go">
                      {s.action}
                      <ChevronIcon />
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="section alt" id="dates">
          <div className="wrap">
            <div className="section-head">
              <h2>Key dates</h2>
            </div>
            <table className="dtable">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Event</th>
                </tr>
              </thead>
              <tbody>
                {timeline.map((t) => (
                  <tr key={t.title}>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <b>{t.when}</b>
                    </td>
                    <td>
                      <b>{t.title}</b>
                      <small>{t.body}</small>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="section" id="faq">
          <div className="wrap">
            <div className="section-head">
              <h2>Frequently asked questions</h2>
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
