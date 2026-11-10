import "server-only";
import { db } from "./db";

export const STATUSES = ["draft", "submitted", "under_review", "interview", "awarded", "waitlisted", "not_selected"] as const;
export type Status = (typeof STATUSES)[number];
export const DECISIONS: Status[] = ["awarded", "waitlisted", "not_selected"];

/** Where an application may move next. Decisions can be revised (for example waitlisted → awarded). */
export const nextStatuses: Record<string, Status[]> = {
  submitted: ["under_review", "not_selected"],
  under_review: ["interview", "awarded", "waitlisted", "not_selected", "submitted"],
  interview: ["awarded", "waitlisted", "not_selected", "under_review"],
  awarded: ["waitlisted", "not_selected"],
  waitlisted: ["awarded", "not_selected"],
  not_selected: ["waitlisted", "awarded", "under_review"],
};

export const scoreCriteria = [
  { key: "academic", label: "Academic promise" },
  { key: "need", label: "Financial need" },
  { key: "essays", label: "Essays" },
  { key: "recommendation", label: "Recommendation" },
] as const;

export interface Counts {
  draft: number;
  submitted: number;
  under_review: number;
  interview: number;
  awarded: number;
  waitlisted: number;
  not_selected: number;
  my_queue: number;
}

export async function statusCounts(staffId: string): Promise<Counts> {
  const q = await db();
  const { rows } = await q.query<{ status: string; n: number }>("select status, count(*)::int as n from applications group by status");
  const c = Object.fromEntries(STATUSES.map((s) => [s, 0])) as unknown as Counts;
  for (const r of rows) (c as unknown as Record<string, number>)[r.status] = Number(r.n);
  const mine = await q.query<{ n: number }>(
    "select count(*)::int as n from applications a where a.status in ('under_review', 'interview') and not exists (select 1 from scores s where s.application_id = a.id and s.staff_id = $1)",
    [staffId],
  );
  c.my_queue = Number(mine.rows[0].n);
  return c;
}

export const fullName = (d: Record<string, string>) => [d.first_name, d.middle_name, d.last_name].filter(Boolean).join(" ").trim() || "Unnamed applicant";
