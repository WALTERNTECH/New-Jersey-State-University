import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { canDecide, requireStaffPage, roleLabels, type Role } from "@/lib/staff";
import { fullName, nextStatuses, scoreCriteria } from "@/lib/committee";
import { documentKinds, statusLabels, steps, wordCount } from "@/lib/form";
import { fmtDate, fmtSize } from "@/lib/client";
import { StatusChip, when } from "@/components/committee/bits";
import { NoteForm, ResetApplicantPassword, ScoreForm, StatusControl } from "@/components/committee/Actions";
import { allowanceBySlug } from "@/lib/content";
import { requestStatusLabels } from "@/lib/allowances";

export const metadata = { title: "Application" };
export const dynamic = "force-dynamic";

const eligibilityText: Record<string, Record<string, string>> = {
  school: { yes: "Completed secondary school", soon: "Finishing secondary school this year" },
  need: { yes: "Needs financial support" },
  degree: { no: "No previous bachelor's degree" },
  age: { yes: "16 or older at start" },
};

export default async function ApplicationDetail({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireStaffPage();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const q = await db();
  const { rows } = await q.query<{
    id: string; reference: string; status: string; data: Record<string, string>; eligibility: Record<string, string>;
    submitted_at: string | null; created_at: string; updated_at: string; email: string;
    arrival: Record<string, string> | null; offer_reply_at: string | null; enrolled_at: string | null;
  }>(
    "select a.id, a.reference, a.status, a.data, a.eligibility, a.submitted_at, a.created_at, a.updated_at, a.arrival, a.offer_reply_at, a.enrolled_at, p.email from applications a join applicants p on p.id = a.applicant_id where a.id = $1",
    [id],
  );
  const app = rows[0];
  if (!app) notFound();

  const [docs, events, notes, scores, lastView, reqs] = await Promise.all([
    q.query<{ id: string; kind: string; filename: string; size: number; created_at: string }>("select id, kind, filename, size, created_at from documents where application_id = $1 order by created_at", [id]),
    q.query<{ status: string; note: string | null; created_at: string; name: string | null }>(
      "select e.status, e.note, e.created_at, s.name from status_events e left join staff s on s.id = e.staff_id where e.application_id = $1 order by e.created_at desc",
      [id],
    ),
    q.query<{ id: number; body: string; created_at: string; name: string; role: Role }>(
      "select n.id, n.body, n.created_at, s.name, s.role from notes n join staff s on s.id = n.staff_id where n.application_id = $1 order by n.created_at desc",
      [id],
    ),
    q.query<{ staff_id: string; name: string; academic: number; need: number; essays: number; recommendation: number; comment: string | null; updated_at: string }>(
      "select sc.staff_id, s.name, sc.academic, sc.need, sc.essays, sc.recommendation, sc.comment, sc.updated_at from scores sc join staff s on s.id = sc.staff_id where sc.application_id = $1 order by sc.updated_at",
      [id],
    ),
    q.query("select 1 from audit where staff_id = $1 and action = 'view_application' and target = $2 and created_at > now() - interval '15 minutes'", [me.id, app.reference]),
    q.query<{ id: string; slug: string; status: string; submitted_at: string }>(
      "select id, slug, status, submitted_at from allowance_requests where application_id = $1 and status <> 'draft' order by submitted_at desc",
      [id],
    ),
  ]);
  if (!lastView.rows.length) await q.query("insert into audit (staff_id, action, target) values ($1, 'view_application', $2)", [me.id, app.reference]);

  const d = app.data;
  const mine = scores.rows.find((s) => s.staff_id === me.id);
  const totals = scores.rows.map((s) => s.academic + s.need + s.essays + s.recommendation);
  const avg = totals.length ? (totals.reduce((a, b) => a + b, 0) / totals.length).toFixed(1) : null;
  const crit = (k: (typeof scoreCriteria)[number]["key"]) => (scores.rows.length ? (scores.rows.reduce((a, s) => a + s[k], 0) / scores.rows.length).toFixed(1) : "–");
  const draft = app.status === "draft";
  const age = d.date_of_birth ? Math.floor((Date.now() - Date.parse(d.date_of_birth)) / (365.25 * 864e5)) : null;
  const latestDoc = (kind: string) => [...docs.rows].reverse().find((x) => x.kind === kind);
  const earlierDocs = (kind: string) => docs.rows.filter((x) => x.kind === kind).slice(0, -1);

  return (
    <>
      <div className="c-head">
        <div style={{ minWidth: 0 }}>
          <p className="flex small" style={{ marginBottom: 6 }}>
            <Link href="/committee/applications?status=all">Applications</Link>
            <span className="muted">/</span>
            <span className="mono">{app.reference}</span>
          </p>
          <h1>{fullName(d)}</h1>
          <p className="flex" style={{ marginTop: 8 }}>
            <StatusChip status={app.status} />
            <span>
              {[d.residence, age !== null ? `${age} years old` : null, d.major].filter(Boolean).join(" · ")}
            </span>
          </p>
        </div>
        {!draft && (
          <div className="flex">
            {canDecide(me) && <ResetApplicantPassword id={app.id} email={app.email} />}
            <StatusControl id={app.id} current={app.status} options={nextStatuses[app.status] ?? []} canDecide={canDecide(me)} />
          </div>
        )}
      </div>

      {draft && (
        <div className="alert alert-info" style={{ marginBottom: 18 }}>
          This application has not been submitted yet. It was last saved {when(app.updated_at)}. You can read it, but it can't be reviewed until the applicant submits.
        </div>
      )}

      <div className="c-split">
        <div className="c-grid">
          {(app.offer_reply_at || reqs.rows.length > 0) && (
            <section className="c-card">
              <div className="c-card-h">
                <h2>Admission and allowances</h2>
                <span className="muted">
                  {app.enrolled_at ? `Enrolled ${fmtDate(app.enrolled_at)}` : app.offer_reply_at ? `Replied to offer ${fmtDate(app.offer_reply_at)}` : ""}
                </span>
              </div>
              <dl className="c-dl">
                <dt>Arrival plan</dt>
                <dd>
                  {app.arrival
                    ? [fmtDate(app.arrival.arrival_date), app.arrival.mode, app.arrival.arrival_point, app.arrival.carrier].filter(Boolean).join(" · ")
                    : "Not submitted"}
                </dd>
                <dt>Emergency contact</dt>
                <dd>{app.arrival ? `${app.arrival.contact_name} (${app.arrival.contact_relationship}) ${app.arrival.contact_phone}` : "—"}</dd>
                {reqs.rows.map((r) => (
                  <div key={r.id} style={{ display: "contents" }}>
                    <dt>{allowanceBySlug(r.slug)?.title ?? r.slug}</dt>
                    <dd>
                      <Link href={`/committee/allowances/${r.id}`}>{requestStatusLabels[r.status]}</Link> · {when(r.submitted_at)}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          <section className="c-card">
            <div className="c-card-h">
              <h2>At a glance</h2>
              <span className="muted">{app.submitted_at ? `Submitted ${fmtDate(app.submitted_at, true)}` : `Started ${fmtDate(app.created_at)}`}</span>
            </div>
            <dl className="c-dl">
              <dt>Email</dt>
              <dd><a href={`mailto:${app.email}`}>{app.email}</a></dd>
              <dt>Phone</dt>
              <dd>{d.phone ? <a href={`tel:${d.phone.replace(/\s/g, "")}`}>{d.phone}</a> : "—"}{d.whatsapp === "Yes" ? " · WhatsApp" : ""}</dd>
              <dt>Household</dt>
              <dd>{d.household_size ? `${d.household_size} people, ${d.earners ?? "?"} earning · ${d.income ?? "income not given"}` : "—"}</dd>
              <dt>Circumstances</dt>
              <dd>
                {[d.first_generation === "Yes" ? "First in family to attend university" : null, d.orphan_or_care === "Yes" ? "Lost a parent or grew up in care" : null].filter(Boolean).join(" · ") || "—"}
              </dd>
              <dt>Eligibility answers</dt>
              <dd>{Object.entries(app.eligibility ?? {}).map(([k, v]) => eligibilityText[k]?.[v] ?? `${k}: ${v}`).join(" · ") || "—"}</dd>
            </dl>
          </section>

          <section className="c-card">
            <div className="c-card-h"><h2>Essays</h2></div>
            {[steps.find((s) => s.id === "essays")!].flatMap((s) => s.fields).map((f) => (
              <div className="c-essay" key={f.name}>
                <h3>{f.label}</h3>
                <p>{d[f.name] || <span className="muted">Not written yet</span>}</p>
                {d[f.name] && <small>{wordCount(d[f.name])} words</small>}
              </div>
            ))}
            {d.circumstances && (
              <div className="c-essay">
                <h3>About their situation</h3>
                <p>{d.circumstances}</p>
              </div>
            )}
          </section>

          <section className="c-card">
            <div className="c-card-h">
              <h2>Documents</h2>
              <span className="muted">Every view is logged</span>
            </div>
            {documentKinds.map((k) => {
              const doc = latestDoc(k.kind);
              const older = earlierDocs(k.kind);
              return (
                <div className="c-doc" key={k.kind}>
                  <div className="k">
                    <b>{k.label}</b>
                    <span>
                      {doc ? `${doc.filename} · ${fmtSize(doc.size)} · uploaded ${when(doc.created_at)}` : k.required ? "Missing" : "Not provided"}
                      {older.length > 0 && ` · ${older.length} earlier version${older.length > 1 ? "s" : ""}`}
                    </span>
                  </div>
                  {doc && (
                    <a className="btn btn-ghost btn-sm" href={`/api/committee/documents/${doc.id}`} target="_blank" rel="noopener">
                      Open
                    </a>
                  )}
                </div>
              );
            })}
          </section>

          {steps.filter((s) => s.id !== "essays").map((s) => (
            <section className="c-card" key={s.id}>
              <div className="c-card-h"><h2>{s.title}</h2></div>
              <dl className="c-dl">
                {s.fields.filter((f) => f.name !== "circumstances").map((f) => (
                  <div key={f.name} style={{ display: "contents" }}>
                    <dt>{f.label}</dt>
                    <dd>{f.name === "rec_email" && d[f.name] ? <a href={`mailto:${d[f.name]}`}>{d[f.name]}</a> : d[f.name] || <span className="muted">—</span>}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>

        <aside className="c-grid">
          <section className="c-card">
            <div className="c-card-h">
              <h2>Committee score</h2>
              <span className="muted">{scores.rows.length} {scores.rows.length === 1 ? "score" : "scores"}</span>
            </div>
            <div className="c-card-b">
              <div className="c-total">
                <b>{avg ?? "–"}</b> <span className="muted">/ 20 average</span>
              </div>
              {scores.rows.length > 0 && (
                <ul className="c-others mt16">
                  {scoreCriteria.map((c) => (
                    <li key={c.key}>
                      <span>{c.label}</span>
                      <b>{crit(c.key)}</b>
                    </li>
                  ))}
                </ul>
              )}
              {scores.rows.length > 0 && (
                <ul className="c-others mt16">
                  {scores.rows.map((s) => (
                    <li key={s.staff_id} style={{ display: "block" }}>
                      <span className="flex" style={{ justifyContent: "space-between" }}>
                        <b>{s.name}{s.staff_id === me.id ? " (you)" : ""}</b>
                        <span>{s.academic + s.need + s.essays + s.recommendation}/20</span>
                      </span>
                      {s.comment && <span className="small muted" style={{ display: "block", marginTop: 4, whiteSpace: "pre-wrap" }}>{s.comment}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="c-card">
            <div className="c-card-h"><h2>{mine ? "Your score" : "Score this application"}</h2></div>
            <div className="c-card-b">
              <ScoreForm id={app.id} open={["under_review", "interview"].includes(app.status)} initial={mine ?? {}} />
            </div>
          </section>

          <section className="c-card">
            <div className="c-card-h">
              <h2>Notes</h2>
              <span className="muted">Committee only</span>
            </div>
            <NoteForm id={app.id} />
            {notes.rows.map((n) => (
              <div className="c-note" key={n.id}>
                <header>
                  <span><b>{n.name}</b> · {roleLabels[n.role]}</span>
                  <time dateTime={n.created_at}>{when(n.created_at)}</time>
                </header>
                <p>{n.body}</p>
              </div>
            ))}
          </section>

          <section className="c-card">
            <div className="c-card-h"><h2>Stage history</h2></div>
            <ol className="c-hist">
              {events.rows.map((e, i) => (
                <li key={i}>
                  <b>{statusLabels[e.status] ?? e.status}</b>
                  <span>{fmtDate(e.created_at, true)}{e.name ? ` · ${e.name}` : " · Applicant"}</span>
                  {e.note && <em>{e.note}</em>}
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>
    </>
  );
}
