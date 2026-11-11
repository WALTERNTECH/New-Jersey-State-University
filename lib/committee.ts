import "server-only";
import { db } from "./db";

export const STATUSES = ["draft", "submitted", "under_review", "interview", "awarded", "waitlisted", "not_selected", "accepted", "declined_offer", "enrolled"] as const;
export type Status = (typeof STATUSES)[number];
export const DECISIONS: Status[] = ["awarded", "waitlisted", "not_selected"];
/** Every status reached after a decision, including the scholar's reply and enrolment. */
export const DECIDED: Status[] = ["awarded", "waitlisted", "not_selected", "accepted", "declined_offer", "enrolled"];

/**
 * Where the Committee may move an application next. Decisions can be revised until the candidate replies.
 * "accepted" and "declined_offer" are the candidate's own reply and are never set by the Committee;
 * "enrolled" is confirmed by the University when an admitted scholar reports to campus.
 */
export const nextStatuses: Record<string, Status[]> = {
  submitted: ["under_review", "not_selected"],
  under_review: ["interview", "awarded", "waitlisted", "not_selected", "submitted"],
  interview: ["awarded", "waitlisted", "not_selected", "under_review"],
  awarded: ["waitlisted", "not_selected"],
  waitlisted: ["awarded", "not_selected"],
  not_selected: ["waitlisted", "awarded", "under_review"],
  accepted: ["enrolled"],
};

export const scoreCriteria = [
  { key: "academic", label: "Academic promise" },
  { key: "need", label: "Financial need" },
  { key: "essays", label: "Essays" },
  { key: "potential", label: "Character and potential" },
] as const;

/** SQL for an application's average score out of 20. */
export const AVG_SCORE_SQL = "(select round(avg(s.academic + s.need + s.essays + s.potential)::numeric, 1) from scores s where s.application_id = a.id)";

export interface Counts {
  draft: number;
  submitted: number;
  under_review: number;
  interview: number;
  awarded: number;
  waitlisted: number;
  not_selected: number;
  accepted: number;
  declined_offer: number;
  enrolled: number;
  my_queue: number;
  allowances_pending: number;
  docs_pending: number;
  emails_unsent: number;
}

export const ENROL_KINDS_SQL = "('passport', 'photo', 'immunisation', 'certificate')";

export async function statusCounts(staffId: string): Promise<Counts> {
  const q = await db();
  const [{ rows }, mine, pending, docs, emails] = await Promise.all([
    q.query<{ status: string; n: number }>("select status, count(*)::int as n from applications group by status"),
    q.query<{ n: number }>(
      "select count(*)::int as n from applications a where a.status in ('submitted', 'under_review', 'interview') and not exists (select 1 from scores s where s.application_id = a.id and s.staff_id = $1)",
      [staffId],
    ),
    q.query<{ n: number }>("select count(*)::int as n from allowance_requests where status = 'submitted'"),
    q.query<{ n: number }>(
      `select count(distinct d.application_id)::int as n from documents d join applications a on a.id = d.application_id
       where a.status = 'accepted' and d.kind in ${ENROL_KINDS_SQL} and d.review = 'pending'`,
    ),
    q.query<{ n: number }>("select count(*)::int as n from emails where status in ('failed', 'skipped') and kind <> 'password_reset'"),
  ]);
  const c = Object.fromEntries(STATUSES.map((s) => [s, 0])) as unknown as Counts;
  for (const r of rows) (c as unknown as Record<string, number>)[r.status] = Number(r.n);
  c.my_queue = Number(mine.rows[0].n);
  c.allowances_pending = Number(pending.rows[0].n);
  c.docs_pending = Number(docs.rows[0].n);
  c.emails_unsent = Number(emails.rows[0].n);
  return c;
}

export const fullName = (d: Record<string, string>) => [d.first_name, d.middle_name, d.last_name].filter(Boolean).join(" ").trim() || "Unnamed applicant";
