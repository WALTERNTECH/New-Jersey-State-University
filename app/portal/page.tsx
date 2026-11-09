import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/Chrome";
import PostDocs from "@/components/PostDocs";
import { currentApplicant } from "@/lib/auth";
import { applicationFor, documentsFor, eventsFor, progress } from "@/lib/application";
import { programme } from "@/lib/content";
import { statusLabels } from "@/lib/form";
import { fmtDate } from "@/lib/client";

export const metadata = { title: "Applicant portal", robots: { index: false } };
export const dynamic = "force-dynamic";

const stages = [
  { id: "draft", title: "Application started" },
  { id: "submitted", title: "Application submitted" },
  { id: "under_review", title: "Under review", hint: "Documents verified and recommender contacted" },
  { id: "interview", title: "Interview", hint: `Shortlisted applicants, ${programme.interviews}` },
  { id: "decision", title: "Decision", hint: `By ${programme.decisions}` },
];
const order = ["draft", "submitted", "under_review", "interview", "decision"];

export default async function Portal() {
  const me = await currentApplicant();
  if (!me) redirect("/signin");
  const app = await applicationFor(me.id);
  if (!app) redirect("/apply");
  const [docs, events] = await Promise.all([documentsFor(app.id), eventsFor(app.id)]);
  const p = progress(app.data, docs);
  const draft = app.status === "draft";
  const stageIdx = order.indexOf(["awarded", "waitlisted", "not_selected"].includes(app.status) ? "decision" : app.status);
  const when = (s: string) => events.find((e) => e.status === s)?.created_at;
  const firstOpen = p.sections.find((s) => !s.done);
  const name = (app.data.preferred_name || app.data.first_name || me.first_name).trim();

  return (
    <>
      <SiteHeader portal />
      <main id="main">
        <div className="portalbar">
          <div className="wrap">
            <div>
              <span className="eyebrow">{programme.name} · {programme.cycle}</span>
              <h1 className="mt8">Welcome, {name}</h1>
            </div>
            <div className="flex">
              <span className={`pill${draft ? "" : " ok"}`}>{statusLabels[app.status] ?? app.status}</span>
              <span className="ref" title="Application reference">{app.reference}</span>
            </div>
          </div>
        </div>

        <div className="wrap dash">
          <div className="stack" style={{ gap: 28 }}>
            {draft ? (
              <section className="panel" aria-labelledby="apph">
                <div className="panel-h">
                  <div>
                    <h2 id="apph">Your application</h2>
                    <p className="small muted mt8">
                      {p.done} of {p.total} sections complete · last saved {fmtDate(app.updated_at, true)}
                    </p>
                  </div>
                  <Link className="btn btn-primary" href={p.ready ? "/portal/application?step=review" : `/portal/application?step=${firstOpen?.id ?? "personal"}`}>
                    {p.ready ? "Review and submit" : p.done === 0 ? "Start application" : "Continue application"}
                  </Link>
                </div>
                <div className="panel-b" style={{ paddingBottom: 8 }}>
                  <div className="bar">
                    <i style={{ width: `${(p.done / p.total) * 100}%` }} />
                  </div>
                </div>
                <ul className="secs">
                  {p.sections.map((s, i) => (
                    <li key={s.id}>
                      <Link href={`/portal/application?step=${s.id}`}>
                        <span className={`circ${s.done ? " done" : ""}`}>{s.done ? "✓" : i + 1}</span>
                        <span>{s.title}</span>
                        <span className={`st${s.done ? " done" : ""}`}>{s.done ? "Complete" : "To do"}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : (
              <>
                <section className="panel" aria-labelledby="subh">
                  <div className="panel-h">
                    <div>
                      <h2 id="subh">Application received</h2>
                      <p className="small muted mt8">Submitted {fmtDate(app.submitted_at, true)}</p>
                    </div>
                    <Link className="btn btn-ghost btn-sm" href="/portal/submitted">
                      View confirmation
                    </Link>
                  </div>
                  <div className="panel-b">
                    <p>
                      Thank you. Your application is with the scholarship committee. We will update this page at each stage, and email {me.email} when there is
                      news.
                    </p>
                  </div>
                </section>
                <section className="panel" aria-labelledby="doch">
                  <div className="panel-h">
                    <h2 id="doch">Supporting documents</h2>
                  </div>
                  <div className="panel-b">
                    <p className="small muted" style={{ marginBottom: 16 }}>
                      Your required documents are on file. You can still add or update the optional ones.
                    </p>
                    <PostDocs initial={docs} />
                  </div>
                </section>
              </>
            )}
          </div>

          <aside className="stack" style={{ gap: 28 }}>
            <section className="panel" aria-labelledby="trackh">
              <div className="panel-h">
                <h2 id="trackh">Application status</h2>
              </div>
              <div className="panel-b">
                <ol className="track">
                  {stages.map((s, i) => {
                    const done = i < stageIdx || (i === stageIdx && i === 0 && !draft);
                    const now = i === stageIdx;
                    const at = when(s.id);
                    return (
                      <li key={s.id} className={i < stageIdx ? "done" : now ? "now" : ""}>
                        <span className="d" />
                        <b>{s.id === "decision" && stageIdx === 4 ? statusLabels[app.status] : s.title}</b>
                        <span>{at && (done || now) ? fmtDate(at) : s.hint ?? (i === 1 ? `Deadline ${programme.deadline}` : "")}</span>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </section>
            <section className="panel">
              <div className="panel-b">
                <h3 style={{ fontSize: 18 }}>Good to know</h3>
                <ul className="small" style={{ paddingLeft: 18, margin: "12px 0 0", color: "var(--ink-2)", display: "grid", gap: 8 }}>
                  <li>Applying is free. We will never ask you for money.</li>
                  <li>Deadline: {programme.deadline}, 11:59 pm Eastern Time.</li>
                  <li>Decisions are released by {programme.decisions}.</li>
                  {programme.contactEmail && (
                    <li>
                      Questions? <a href={`mailto:${programme.contactEmail}`}>{programme.contactEmail}</a>
                    </li>
                  )}
                </ul>
              </div>
            </section>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
