import "server-only";
import { db } from "./db";
import { audit } from "./staff";
import { nextStatuses } from "./committee";
import { enrolmentDocs, statusLabels } from "./form";
import { issueLetter, revokeLetter } from "./letter";
import { alertOffice, sendEmail } from "./email";

// Every stage change goes through here, so letters, emails and the activity log always follow automatically.

const label = (s: string) => statusLabels[s] ?? s;
const STAGE_EMAILS = ["under_review", "interview", "waitlisted", "not_selected"];

type Result = { ok: true; from: string } | { ok: false; code: number; error: string };

interface Row {
  status: string;
  reference: string;
  cleared_at: string | null;
  data: Record<string, string>;
  email: string;
  applicant_id: string;
  first_name: string;
  [k: string]: unknown;
}

const nameOf = (r: Pick<Row, "data" | "first_name">) => (r.data.preferred_name || r.data.first_name || r.first_name || "").trim();

export async function changeStatus(appId: string, to: string, staffId: string, note: string | null, opts: { auto?: boolean } = {}): Promise<Result> {
  const q = await db();
  const out = await q.tx(async (t) => {
    const { rows } = await t.query<Row>(
      `select a.status, a.reference, a.cleared_at, a.data, p.email, p.id as applicant_id, p.first_name
       from applications a join applicants p on p.id = a.applicant_id where a.id = $1 for update of a`,
      [appId],
    );
    const r = rows[0];
    if (!r) return { ok: false as const, code: 404, error: "Not found" };
    const from = r.status;
    if (!(nextStatuses[from] ?? []).includes(to as never))
      return { ok: false as const, code: 409, error: `An application that is ${label(from).toLowerCase()} can't move to ${label(to).toLowerCase()}` };
    if (to === "enrolled" && !r.cleared_at)
      return { ok: false as const, code: 409, error: "Verify this scholar's identification documents and arrival plan first. A scholar can be enrolled once cleared to report." };
    await t.query(
      "update applications set status = $2, updated_at = now(), enrolled_at = case when $2 = 'enrolled' then now() else enrolled_at end where id = $1",
      [appId, to],
    );
    await t.query("insert into status_events (application_id, status, note, staff_id) values ($1, $2, $3, $4)", [appId, to, note, staffId]);
    if (to === "awarded") await issueLetter(appId, t);
    if (from === "awarded") await revokeLetter(appId, t);
    await audit(staffId, "status_change", r.reference, `${label(from)} → ${label(to)}${note ? ` · ${note}` : ""}${opts.auto ? " (automatic)" : ""}`, t);
    return { ok: true as const, from, r };
  });
  if (!out.ok) return out;

  const { r } = out;
  const base = { to: r.email, applicantId: r.applicant_id };
  const params = { name: nameOf(r), reference: r.reference };
  if (STAGE_EMAILS.includes(to)) await sendEmail({ ...base, kind: "stage", params: { ...params, status: to } });
  if (to === "awarded") await sendEmail({ ...base, kind: "awarded", params: { ...params, application_id: appId } });
  if (to === "enrolled") await sendEmail({ ...base, kind: "enrolled", params });
  return { ok: true, from: out.from };
}

/**
 * Once every required identification document is verified and the arrival plan is in, the scholar is
 * cleared to report: recorded in their history and confirmed to them by email, with no one having to remember.
 */
export async function maybeClear(appId: string): Promise<boolean> {
  const q = await db();
  const { rows } = await q.query<Row & { arrival: unknown }>(
    `select a.status, a.reference, a.cleared_at, a.arrival, a.data, p.email, p.id as applicant_id, p.first_name
     from applications a join applicants p on p.id = a.applicant_id where a.id = $1`,
    [appId],
  );
  const r = rows[0];
  if (!r || r.status !== "accepted" || r.cleared_at || !r.arrival) return false;
  const docs = await q.query<{ kind: string }>("select distinct kind from documents where application_id = $1 and review = 'verified'", [appId]);
  const have = new Set(docs.rows.map((d) => d.kind));
  if (!enrolmentDocs.filter((d) => d.required).every((d) => have.has(d.kind))) return false;
  const upd = await q.query<{ id: string }>("update applications set cleared_at = now(), updated_at = now() where id = $1 and cleared_at is null returning id", [appId]);
  if (!upd.rows[0]) return false;
  await q.query("insert into status_events (application_id, status, note) values ($1, 'cleared', 'Identification documents verified and arrival plan received')", [appId]);
  await audit(null, "cleared", r.reference);
  await sendEmail({ kind: "cleared", to: r.email, applicantId: r.applicant_id, params: { name: nameOf(r), reference: r.reference } });
  await alertOffice("office_cleared", { name: [r.data.first_name, r.data.last_name].filter(Boolean).join(" ") || nameOf(r), reference: r.reference });
  return true;
}
