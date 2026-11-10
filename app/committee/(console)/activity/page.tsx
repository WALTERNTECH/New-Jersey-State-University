import Link from "next/link";
import { db } from "@/lib/db";
import { requireStaffPage } from "@/lib/staff";
import { actionLabels } from "@/components/committee/bits";

export const metadata = { title: "Activity log" };
export const dynamic = "force-dynamic";

const PAGE = 100;

export default async function Activity({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  await requireStaffPage({ owner: true });
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const q = await db();
  const { rows } = await q.query<{ name: string | null; email: string | null; action: string; target: string | null; detail: string | null; created_at: string }>(
    `select s.name, s.email, a.action, a.target, a.detail, a.created_at from audit a left join staff s on s.id = a.staff_id
     order by a.created_at desc limit ${PAGE + 1} offset ${(page - 1) * PAGE}`,
  );
  const more = rows.length > PAGE;
  return (
    <>
      <div className="c-head">
        <div>
          <h1>Activity log</h1>
          <p>Every sign-in, document view, score, note and decision. Entries can't be edited or removed.</p>
        </div>
      </div>
      <section className="c-card">
        {rows.length ? (
          <table className="c-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Who</th>
                <th>What</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, PAGE).map((r, i) => (
                <tr key={i} style={{ cursor: "default" }}>
                  <td className="muted" style={{ whiteSpace: "nowrap" }}>
                    {new Date(r.created_at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td data-label="Who">{r.name ?? "System"}</td>
                  <td data-label="What">
                    {actionLabels[r.action] ?? r.action} {r.target && <span className="mono">{r.target}</span>}
                  </td>
                  <td data-label="Details" className="muted">{r.detail ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="c-empty">No activity yet</p>
        )}
        {(page > 1 || more) && (
          <div className="c-pager">
            <span>Page {page}</span>
            <span className="flex">
              {page > 1 && <Link className="btn btn-ghost btn-sm" href={`/committee/activity?page=${page - 1}`}>Newer</Link>}
              {more && <Link className="btn btn-ghost btn-sm" href={`/committee/activity?page=${page + 1}`}>Older</Link>}
            </span>
          </div>
        )}
      </section>
    </>
  );
}
