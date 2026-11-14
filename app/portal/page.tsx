import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/Chrome";
import PostDocs from "@/components/PostDocs";
import EnrolmentDocs from "@/components/EnrolmentDocs";
import { ArrivalForm, OfferReply } from "@/components/portal/Admission";
import { requireApplicant } from "@/lib/auth";
import { applicationFor, documentsFor, eventsFor, progress } from "@/lib/application";
import { requestsFor, requestStatusLabels } from "@/lib/allowances";
import { allowanceBySlug, allowances, levelOf, programme } from "@/lib/content";
import { awardLines } from "@/lib/award";
import { letterFor, letterIsCurrent } from "@/lib/letter";
import { masked, paymentFor, paymentSummary } from "@/lib/payment";
import { CheckIcon } from "@/components/Icons";
import PaymentDetails from "@/components/portal/PaymentDetails";
import { enrolKindSet, enrolmentDocs, statusLabels } from "@/lib/form";
import { fmtDate } from "@/lib/client";

export const metadata = { title: "Applicant portal", robots: { index: false } };
export const dynamic = "force-dynamic";

const ADMITTED_STAGES = ["awarded", "accepted", "enrolled"];

const headline: Record<string, string> = {
  submitted: "Your application has been received",
  under_review: "Your application is under review",
  interview: "You have been invited to interview",
  awarded: "Offer of admission",
  waitlisted: "You have been placed on the waitlist",
  not_selected: "Admission decision",
  accepted: "Preparing for your arrival",
  declined_offer: "You have declined your offer",
  enrolled: "Welcome to New Jersey State University",
};

function message(status: string, email: string) {
  switch (status) {
    case "under_review":
      return "The Scholarship Committee is reviewing your application.";
    case "interview":
      return `Congratulations on being shortlisted. The Office of Admissions will write to you at ${email} to arrange a 30-minute interview with members of the Scholarship Committee.`;
    case "awarded":
      return `On behalf of the Scholarship Committee, it is my pleasure to offer you admission to New Jersey State University for ${programme.startTerm}, with the ${programme.name}. Please review the terms of your award below and reply to this offer by ${programme.replyBy}.`;
    case "waitlisted":
      return "The Committee was impressed by your application and has placed you on the waitlist. Should a place become available, you will be notified immediately through this portal and by email.";
    case "not_selected":
      return "We regret that we are unable to offer you admission with the Access Scholarship this year. The Committee received many exceptional applications, and its decisions reflect the limited number of places rather than any shortcoming in your achievements. We encourage you to apply in a future cycle.";
    case "accepted":
      return `Complete the steps below before you report to campus in ${programme.arrival}.`;
    case "declined_offer":
      return "You have declined your offer of admission. We wish you every success in your studies. If you declined in error, please contact the Office of Admissions without delay.";
    case "enrolled":
      return "You are enrolled as an Access Scholar. Allowances for enrolled students, including summer research, study abroad and emergency support, are now open to you.";
    default:
      return `Your application has been received. Updates are shown here and sent to ${email}.`;
  }
}

export default async function Portal() {
  const me = await requireApplicant("/portal");
  const app = await applicationFor(me.id);
  if (!app) redirect("/apply");
  const [allDocs, events, requests, letter, payment, paySummary] = await Promise.all([documentsFor(app.id), eventsFor(app.id), requestsFor(app.id), letterFor(app.id), paymentFor(app.id), paymentSummary(app.id)]);
  const docs = allDocs.filter((d) => !enrolKindSet.has(d.kind));
  const idDocs = allDocs.filter((d) => enrolKindSet.has(d.kind));
  const latestId = (kind: string) => [...idDocs].reverse().find((d) => d.kind === kind);
  const idRequired = enrolmentDocs.filter((k) => k.required);
  const idUploaded = idRequired.every((k) => latestId(k.kind) && latestId(k.kind)!.review !== "rejected");
  const idVerified = idRequired.every((k) => latestId(k.kind)?.review === "verified");
  const hasLetter = letterIsCurrent(letter);
  const p = progress(app.data, docs, payment);
  const s = app.status;
  const draft = s === "draft";
  const admitted = ADMITTED_STAGES.includes(s);
  const firstOpen = p.sections.find((x) => !x.done);
  const name = (app.data.preferred_name || app.data.first_name || me.first_name).trim();
  const at = (st: string) => events.filter((e) => e.status === st).at(-1)?.created_at;
  const submittedReqs = requests.filter((r) => r.status !== "draft");
  const arrival = (app as unknown as { arrival: Record<string, string> | null }).arrival ?? null;
  const preArrival = allowances.filter((a) => a.phase === "admitted");

  // The status rail: the review stages, then the decision, then the scholar's own steps once admitted.
  const decisionDone = ["awarded", "waitlisted", "not_selected", "accepted", "declined_offer", "enrolled"].includes(s);
  const rank = ["draft", "submitted", "under_review", "interview"].indexOf(s);
  const rail = [
    { title: "Application started", done: true, now: draft, date: app.created_at },
    { title: "Application submitted", done: !draft, now: s === "submitted", date: app.submitted_at, hint: `Deadline ${programme.deadline}` },
    { title: "Committee review", done: decisionDone || rank >= 2, now: s === "under_review", date: at("under_review"), hint: "Academic documents verified" },
    { title: "Interview", done: decisionDone || rank >= 3, now: s === "interview", date: at("interview"), hint: `Shortlisted candidates, ${programme.interviews}` },
    { title: decisionDone ? statusLabels[["accepted", "declined_offer", "enrolled"].includes(s) ? "awarded" : s] : "Admission decision", done: decisionDone && s !== "awarded", now: s === "awarded" || s === "waitlisted" || s === "not_selected", date: at("awarded") ?? at(s), hint: `By ${programme.decisions}` },
    ...(admitted || s === "declined_offer"
      ? [
          { title: s === "declined_offer" ? "Offer declined" : "Offer accepted", done: s !== "awarded", now: s === "awarded", date: app.offer_reply_at as string | null, hint: `Reply by ${programme.replyBy}` },
          ...(s === "declined_offer"
            ? []
            : [
                { title: "Cleared to report", done: !!app.cleared_at, now: s === "accepted" && !app.cleared_at, date: app.cleared_at, hint: "Documents and arrival plan verified" },
                { title: "Reported to campus", done: s === "enrolled", now: s === "accepted" && !!app.cleared_at, date: app.enrolled_at as string | null, hint: `Registration, ${programme.arrival}` },
              ]),
        ]
      : []),
  ];

  return (
    <>
      <SiteHeader portal />
      <main id="main" className="portal">
        <div className="portalbar">
          <div className="wrap">
            <div>
              <span className="kicker">{programme.name} · {programme.cycle}</span>
              <h1>Welcome, {name}</h1>
            </div>
            <div className="flex">
              <span className={`pill${draft ? "" : " ok"}`}>{statusLabels[s] ?? s}</span>
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
                    <h2 id="apph">{programme.cycleCode} Access Scholarship application</h2>
                    <p className="small muted mt8">Last saved {fmtDate(app.updated_at, true)}</p>
                  </div>
                  <Link className="btn btn-primary" href={p.ready ? "/portal/application?step=review" : `/portal/application?step=${firstOpen?.id ?? "personal"}`}>
                    {p.ready ? "Review and submit" : p.percent === 0 ? "Start application" : "Continue application"}
                  </Link>
                </div>
                <div className="panel-b">
                  <div className="pctline">
                    <b>{p.percent}% complete</b>
                    <span className="small muted">
                      {p.done} of {p.total} sections
                    </span>
                  </div>
                  <div className="bar" role="progressbar" aria-label="Application progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={p.percent}>
                    <i style={{ width: `${p.percent}%` }} />
                  </div>
                </div>
                <ul className="secs">
                  {p.sections.map((x, i) => (
                    <li key={x.id}>
                      <Link href={`/portal/application?step=${x.id}`}>
                        <span className={`circ${x.done ? " done" : ""}`}>{x.done ? <CheckIcon /> : i + 1}</span>
                        <span>{x.title}</span>
                        <span className={`st${x.done ? " done" : x.state === "started" ? " started" : ""}`}>{x.done ? "Completed" : x.state === "started" ? "In progress" : "Not started"}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : (
              <section className={`panel${admitted ? " awarded" : ""}`} aria-labelledby="subh">
                <div className="panel-h">
                  <div>
                    <h2 id="subh">{headline[s] ?? "Your application"}</h2>
                    <p className="small muted mt8">Submitted {fmtDate(app.submitted_at, true)}</p>
                  </div>
                  <Link className="btn btn-ghost btn-sm" href="/portal/submitted">Confirmation</Link>
                </div>
                <div className="panel-b stack">
                  <p className={s === "awarded" ? "letter" : ""}>{message(s, me.email)}</p>
                  {s === "awarded" && <p className="letter-sign">The Scholarship Committee<br /><span className="muted small">{programme.office}</span></p>}
                </div>
                {hasLetter && (
                  <div className="letterbar">
                    <span>Your letter of admission, issued {fmtDate(letter!.issued_at)}. A copy was sent to {me.email}.</span>
                    <a className="btn btn-primary btn-sm" href="/api/letter" target="_blank" rel="noopener">Download letter (PDF)</a>
                  </div>
                )}
              </section>
            )}

            {admitted && (
              <section className="panel" aria-labelledby="awh">
                <div className="panel-h">
                  <h2 id="awh">Your award</h2>
                  <Link className="small" href="/financial-aid">Full terms</Link>
                </div>
                <ul className="award">
                  {awardLines(app.data).map((l) => (
                    <li key={l.title}>
                      <span>{l.title}</span>
                      <span><b>{l.amount}</b> <span className="muted small">{l.cadence}</span></span>
                    </li>
                  ))}
                </ul>
                <p className="panel-b small muted" style={{ borderTop: "1px solid var(--line)" }}>
                  Awards are renewed each year for up to {levelOf(app.data).semesters} semesters while the scholar remains enrolled full-time and in good academic standing.
                </p>
              </section>
            )}

            {s === "awarded" && (
              <section className="panel" aria-labelledby="replyh">
                <div className="panel-h"><h2 id="replyh">Reply to your offer</h2></div>
                <div className="panel-b"><OfferReply replyBy={programme.replyBy} /></div>
              </section>
            )}

            {s === "accepted" && (
              <section className="panel" aria-labelledby="preph">
                <div className="panel-h"><h2 id="preph">Before you report to campus</h2></div>
                <ol className="prep">
                  <li className="done">
                    <b>Offer accepted</b>
                    <p>{fmtDate(app.offer_reply_at as string, true)}</p>
                  </li>
                  <li className={idVerified ? "done" : "now"}>
                    <b>Upload your identification documents</b>
                    <p>{idVerified ? "Verified" : idUploaded ? "Awaiting verification" : "Not uploaded"}</p>
                    <div className="mt16"><EnrolmentDocs initial={idDocs} /></div>
                  </li>
                  <li className={arrival ? "done" : idUploaded ? "now" : ""}>
                    <b>Submit your arrival plan</b>
                    <div className="mt16"><ArrivalForm initial={arrival as never} /></div>
                  </li>
                  <li className={submittedReqs.length ? "done" : ""}>
                    <b>Request your pre-arrival allowances</b>
                    <div className="flex mt16">
                      {preArrival.map((a) => (
                        <Link key={a.slug} className="btn btn-ghost btn-sm" href={`/portal/allowances/${a.slug}`}>{a.title.replace(/ Allowance| Grant| and Board Allowance|, Immigration and SEVIS Fee Reimbursement/g, "")}</Link>
                      ))}
                    </div>
                  </li>
                  <li className={app.cleared_at ? "done" : ""}>
                    <b>{app.cleared_at ? "Cleared to report" : "Clearance to report"}</b>
                    <p>{app.cleared_at ? fmtDate(app.cleared_at) : "After documents are verified and the arrival plan is received"}</p>
                  </li>
                  <li className={app.cleared_at ? "now" : ""}>
                    <b>Report to campus in person</b>
                    <p>
                      Registration, {programme.arrival}. Bring your passport, your letter of admission and your original certificates.
                    </p>
                  </li>
                </ol>
              </section>
            )}

            {(s === "accepted" || s === "enrolled") && (
              <section className="panel" aria-labelledby="reqh">
                <div className="panel-h">
                  <h2 id="reqh">Allowance requests</h2>
                  <Link className="btn btn-primary btn-sm" href="/portal/allowances">All allowances</Link>
                </div>
                {submittedReqs.length ? (
                  <ul className="secs">
                    {submittedReqs.map((r) => (
                      <li key={r.id}>
                        <Link href={`/portal/allowances/${r.slug}`}>
                          <span>{allowanceBySlug(r.slug)?.title ?? r.slug}</span>
                          <span className={`st${["approved", "disbursed"].includes(r.status) ? " done" : ""}`}>{requestStatusLabels[r.status]}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="panel-b muted small">You have not submitted any allowance requests yet.</p>
                )}
              </section>
            )}

            {!draft && !admitted && s !== "declined_offer" && (
              <section className="panel" aria-labelledby="doch">
                <div className="panel-h"><h2 id="doch">Supporting documents</h2></div>
                <div className="panel-b">
                  <PostDocs initial={docs} />
                </div>
              </section>
            )}

            {!draft && !["not_selected", "declined_offer"].includes(s) && (
              <section className="panel" aria-labelledby="payh">
                <div className="panel-h">
                  <h2 id="payh">Payment details</h2>
                </div>
                <div className="panel-b">
                  <PaymentDetails initial={payment ?? {}} account={masked(paySummary)} />
                </div>
              </section>
            )}
          </div>

          <aside className="stack" style={{ gap: 28 }}>
            <section className="panel" aria-labelledby="trackh">
              <div className="panel-h"><h2 id="trackh">Status</h2></div>
              <div className="panel-b">
                <ol className="track">
                  {rail.map((r, i) => (
                    <li key={i} className={r.now ? "now" : r.done ? "done" : ""}>
                      <span className="d" />
                      <b>{r.title}</b>
                      <span>{r.date && (r.done || r.now) ? fmtDate(r.date) : r.hint ?? ""}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </section>
            <section className="panel">
              <div className="panel-b">
                <h3 style={{ fontSize: 18 }}>Key dates</h3>
                <ul className="small" style={{ paddingLeft: 18, margin: "12px 0 0", color: "var(--ink-2)", display: "grid", gap: 8 }}>
                  <li>Application deadline: {programme.deadline}, {programme.deadlineTime}</li>
                  <li>Admission decisions: by {programme.decisions}</li>
                  <li>Reply to offers: by {programme.replyBy}</li>
                  <li>Registration and orientation: {programme.arrival}</li>
                  {programme.contactEmail && (
                    <li>Enquiries: <a href={`mailto:${programme.contactEmail}`}>{programme.contactEmail}</a></li>
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
