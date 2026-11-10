import { db } from "@/lib/db";
import { requireStaffPage, roleLabels, type Role } from "@/lib/staff";
import { AddStaff, StaffRowActions } from "@/components/committee/StaffAdmin";
import { when } from "@/components/committee/bits";

export const metadata = { title: "Committee members" };
export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const me = await requireStaffPage({ owner: true });
  const q = await db();
  const { rows } = await q.query<{ id: string; name: string; email: string; role: Role; disabled: boolean; mfa: boolean; must_change: boolean; last_seen: string | null; scored: number }>(
    `select s.id, s.name, s.email, s.role, s.disabled, (s.totp_secret is not null) as mfa, s.must_change, s.last_seen,
       (select count(*)::int from scores sc where sc.staff_id = s.id) as scored
     from staff s order by s.disabled, s.role, s.name`,
  );
  return (
    <>
      <div className="c-head">
        <div>
          <h1>Committee members</h1>
          <p>{rows.filter((r) => !r.disabled).length} with access</p>
        </div>
      </div>
      <div className="c-split">
        <section className="c-card">
          <table className="c-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Sign-in</th>
                <th>Scored</th>
                <th>Last active</th>
                <th style={{ textAlign: "right" }}>Role and access</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} style={{ cursor: "default", opacity: r.disabled ? 0.6 : 1 }}>
                  <td>
                    <b>{r.name}{r.id === me.id ? " (you)" : ""}</b>
                    <span className="sub">{r.email} · {roleLabels[r.role]}</span>
                  </td>
                  <td data-label="Sign-in">
                    {r.disabled ? <span className="c-st not_selected">Off</span> : r.mfa && !r.must_change ? <span className="c-st awarded">Ready</span> : <span className="c-st submitted">Not set up yet</span>}
                  </td>
                  <td data-label="Scored" className="num">{r.scored}</td>
                  <td data-label="Last active" className="muted">{r.last_seen ? when(r.last_seen) : "Never"}</td>
                  <td data-label="">
                    <StaffRowActions id={r.id} email={r.email} role={r.role} disabled={r.disabled} self={r.id === me.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="c-card">
          <div className="c-card-h"><h2>Add a committee member</h2></div>
          <div className="c-card-b">
            <AddStaff />
          </div>
        </section>
      </div>
    </>
  );
}
