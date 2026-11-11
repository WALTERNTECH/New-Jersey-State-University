import Link from "next/link";
import { db } from "@/lib/db";
import { canDecide, requireStaffPage } from "@/lib/staff";
import { AVG_SCORE_SQL, fullName, statusCounts } from "@/lib/committee";
import { programmes } from "@/lib/content";
import FilterBar from "@/components/committee/FilterBar";
import { StatusChip, when } from "@/components/committee/bits";
import { BulkBar } from "@/components/committee/Workflow";

export const metadata = { title: "Applications" };
export const dynamic = "force-dynamic";

const PAGE = 50;
const tabs = [
  { id: "submitted", label: "New" },
  { id: "under_review", label: "Under review" },
  { id: "interview", label: "Interview" },
  { id: "decided", label: "Decided" },
  { id: "all", label: "All submitted" },
  { id: "mine", label: "Awaiting my score" },
  { id: "draft", label: "In progress" },
];
const titles: Record<string, string> = {
  submitted: "New applications",
  under_review: "Under review",
  interview: "Interview",
  decided: "Decided",
  all: "All submitted applications",
  mine: "Awaiting my score",
  draft: "Applications still in progress",
};

type Search = { status?: string; q?: string; country?: string; major?: string; sort?: string; page?: string };

export default async function Applications({ searchParams }: { searchParams: Promise<Search> }) {
  const me = await requireStaffPage();
  const sp = await searchParams;
  const status = tabs.some((t) => t.id === sp.status) ? sp.status! : "all";
  const page = Math.max(1, Number(sp.page) || 1);

  const where: string[] = [];
  const args: unknown[] = [];
  const arg = (v: unknown) => (args.push(v), `$${args.length}`);
  if (status === "all") where.push("a.status <> 'draft'");
  else if (status === "decided") where.push("a.status in ('awarded', 'waitlisted', 'not_selected', 'accepted', 'declined_offer', 'enrolled')");
  else if (status === "mine") where.push(`a.status in ('under_review', 'interview') and not exists (select 1 from scores s where s.application_id = a.id and s.staff_id = ${arg(me.id)})`);
  else where.push(`a.status = ${arg(status)}`);
  if (sp.q?.trim()) {
    const like = arg(`%${sp.q.trim().replace(/[%_\\]/g, (m) => "\\" + m)}%`);
    where.push(`(a.reference ilike ${like} or p.email ilike ${like} or (coalesce(a.data->>'first_name','') || ' ' || coalesce(a.data->>'last_name','')) ilike ${like})`);
  }
  if (sp.country) where.push(`a.data->>'residence' = ${arg(sp.country)}`);
  if (sp.major) where.push(`a.data->>'major' = ${arg(sp.major)}`);
  const order =
    sp.sort === "score" ? "avg_score desc nulls last, a.submitted_at" :
    sp.sort === "name" ? "lower(a.data->>'last_name'), lower(a.data->>'first_name')" :
    sp.sort === "oldest" ? "coalesce(a.submitted_at, a.updated_at) asc" :
    "coalesce(a.submitted_at, a.updated_at) desc";

  const q = await db();
  const sql = `
    select a.id, a.reference, a.status, a.data, a.submitted_at, a.updated_at, p.email,
      ${AVG_SCORE_SQL}::float as avg_score,
      (select count(*)::int from scores s where s.application_id = a.id) as n_scores,
      count(*) over()::int as total
    from applications a join applicants p on p.id = a.applicant_id
    where ${where.join(" and ")}
    order by ${order}
    limit ${PAGE} offset ${(page - 1) * PAGE}`;
  const [{ rows }, countries, counts] = await Promise.all([
    q.query<{ id: string; reference: string; status: string; data: Record<string, string>; submitted_at: string | null; updated_at: string; email: string; avg_score: number | null; n_scores: number; total: number }>(sql, args),
    q.query<{ c: string }>("select distinct data->>'residence' as c from applications where data->>'residence' is not null order by 1"),
    statusCounts(me.id),
  ]);
  const total = rows[0]?.total ?? 0;
  // Bulk moves make sense for applications under consideration, not drafts or finished cases.
  const bulk = ["submitted", "under_review", "interview", "mine", "all"].includes(status);
  const countFor = (id: string) =>
    id === "decided" ? counts.awarded + counts.waitlisted + counts.not_selected + counts.accepted + counts.declined_offer + counts.enrolled :
    id === "all" ? counts.submitted + counts.under_review + counts.interview + counts.awarded + counts.waitlisted + counts.not_selected + counts.accepted + counts.declined_offer + counts.enrolled :
    id === "mine" ? counts.my_queue :
    (counts as unknown as Record<string, number>)[id];

  const link = (changes: Partial<Search>) => {
    const p = new URLSearchParams();
    const merged = { ...sp, ...changes };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, String(v));
    return `/committee/applications?${p.toString()}`;
  };

  return (
    <>
      <div className="c-head">
        <div>
          <h1>{titles[status]}</h1>
          <p>{total} {total === 1 ? "application" : "applications"}{sp.q ? ` matching “${sp.q}”` : ""}</p>
        </div>
      </div>
      {bulk && <BulkBar canDecide={canDecide(me)} />}
      <div className="c-card">
        <nav className="c-tabs" aria-label="Stage">
          {tabs.map((t) => (
            <Link key={t.id} href={`/committee/applications?status=${t.id}`} aria-current={t.id === status ? "page" : undefined}>
              {t.label} <span className="c-count">{countFor(t.id)}</span>
            </Link>
          ))}
        </nav>
        <FilterBar countries={countries.rows.map((r) => r.c)} majors={programmes} />
        {rows.length ? (
          <table className="c-table">
            <thead>
              <tr>
                {bulk && (
                  <th className="c-pick">
                    <input type="checkbox" name="pickall" aria-label="Select all on this page" />
                  </th>
                )}
                <th>Applicant</th>
                <th>Reference</th>
                <th>Country</th>
                <th>Programme</th>
                <th>Income</th>
                <th>Score</th>
                <th>Stage</th>
                <th>{status === "draft" ? "Last saved" : "Submitted"}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} style={{ position: "relative" }}>
                  {bulk && (
                    <td className="c-pick">
                      <input type="checkbox" name="pick" value={r.id} aria-label={`Select ${fullName(r.data)}`} />
                    </td>
                  )}
                  <td>
                    <a className="rowlink" href={`/committee/applications/${r.id}`}>
                      {fullName(r.data)}
                    </a>
                    <span className="sub">{r.email}</span>
                  </td>
                  <td data-label="Reference" className="mono">{r.reference}</td>
                  <td data-label="Country">{r.data.residence || "—"}</td>
                  <td data-label="Programme">{r.data.major || "—"}</td>
                  <td data-label="Income" className="nowrap">{(r.data.income || "—").replace(/ – /g, "–")}</td>
                  <td data-label="Score" className="num">
                    {r.avg_score !== null ? (
                      <>
                        <b>{r.avg_score}</b>
                        <span className="muted">/20 · {r.n_scores}</span>
                      </>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                  <td data-label="Stage"><StatusChip status={r.status} /></td>
                  <td data-label={status === "draft" ? "Last saved" : "Submitted"} className="muted">{when(r.submitted_at ?? r.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="c-empty">{sp.q || sp.country || sp.major ? "No applications match these filters." : "Nothing here right now."}</p>
        )}
        {total > PAGE && (
          <div className="c-pager">
            <span>
              {(page - 1) * PAGE + 1}–{Math.min(page * PAGE, total)} of {total}
            </span>
            <span className="flex">
              {page > 1 && <Link className="btn btn-ghost btn-sm" href={link({ page: String(page - 1) })}>Previous</Link>}
              {page * PAGE < total && <Link className="btn btn-ghost btn-sm" href={link({ page: String(page + 1) })}>Next</Link>}
            </span>
          </div>
        )}
      </div>
    </>
  );
}
