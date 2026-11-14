import Link from "next/link";
import { programme } from "@/lib/content";

/** The right-hand column beside the sign-in and application forms on wide screens. */
export default function AuthAside({ current, signIn = false }: { current?: number; signIn?: boolean }) {
  const steps = ["Check your eligibility", "Create your account", "Complete the application", "Submit and follow your decision"];
  return (
    <aside className="authx-aside">
      {signIn && (
        <section className="panel">
          <div className="panel-h">
            <h2>New applicant</h2>
          </div>
          <div className="panel-b">
            <Link className="btn btn-outline btn-block" href="/apply">
              Start an application
            </Link>
          </div>
        </section>
      )}
      {!signIn && (
        <section className="panel">
          <div className="panel-h">
            <h2>How to apply</h2>
          </div>
          <ol className="asteps">
            {steps.map((s, i) => (
              <li key={s} className={current === i + 1 ? "now" : current && i + 1 < current ? "done" : ""}>
                <span>{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
        </section>
      )}
      <section className="panel">
        <div className="panel-h">
          <h2>Key dates</h2>
        </div>
        <dl className="adates">
          <dt>Application deadline</dt>
          <dd>
            {programme.deadline}
            <small>{programme.deadlineTime}</small>
          </dd>
          <dt>Admission decisions</dt>
          <dd>{programme.decisions}</dd>
          <dt>Study begins</dt>
          <dd>{programme.startTerm}</dd>
        </dl>
      </section>
      {programme.contactEmail && (
        <section className="panel">
          <div className="panel-h">
            <h2>Contact</h2>
          </div>
          <div className="panel-b">
            <a href={`mailto:${programme.contactEmail}`}>{programme.contactEmail}</a>
          </div>
        </section>
      )}
    </aside>
  );
}
