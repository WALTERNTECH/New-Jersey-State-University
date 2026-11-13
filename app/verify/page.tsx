import { SiteFooter, SiteHeader } from "@/components/Chrome";
import { db } from "@/lib/db";
import { programme } from "@/lib/content";
import { fmtDate } from "@/lib/client";
import { LETTER_STATUSES } from "@/lib/letter";

export const metadata = {
  title: "Verify a letter of admission",
  description: `Confirm that a letter of admission to ${programme.university} is authentic.`,
};
export const dynamic = "force-dynamic";

const standing: Record<string, string> = {
  awarded: "Offer of admission stands",
  accepted: "Offer accepted",
  enrolled: "Enrolled",
};

export default async function Verify({ searchParams }: { searchParams: Promise<{ ref?: string; code?: string }> }) {
  const sp = await searchParams;
  const ref = String(sp.ref ?? "").trim().toUpperCase().slice(0, 30);
  let code = String(sp.code ?? "").trim().toUpperCase().replace(/[\s-]/g, "").slice(0, 12);
  if (code.length === 8) code = `${code.slice(0, 4)}-${code.slice(4)}`;
  const asked = !!(ref && code);

  type Found = { data: Record<string, string>; status: string; issued_at: string; revoked_at: string | null; [k: string]: unknown };
  let found = null as Found | null;
  if (asked) {
    const q = await db();
    const { rows } = await q.query<Found>(
      "select a.data, a.status, l.issued_at, l.revoked_at from letters l join applications a on a.id = l.application_id where a.reference = $1 and l.code = $2",
      [ref, code],
    );
    found = rows[0] ?? null;
  }
  const current = !!found && !found.revoked_at && LETTER_STATUSES.includes(found.status);
  const name = found ? [found.data.first_name, found.data.middle_name, found.data.last_name].filter(Boolean).join(" ") : "";

  return (
    <>
      <SiteHeader />
      <main id="main">
        <section className="pagehero">
          <div className="wrap">
            <span className="kicker light">Office of Admissions</span>
            <h1>Verify a letter of admission</h1>
            <p>Enter the reference and verification code printed at the foot of the letter to confirm that it was issued by {programme.university}.</p>
          </div>
        </section>
        <section className="section">
          <div className="wrap-narrow stack" style={{ gap: 24 }}>
            <form className="panel panel-b verify-form" method="get">
              <div className="field">
                <label htmlFor="ref">Application reference</label>
                <input id="ref" name="ref" className="input" placeholder="NJSU-27-XXXXXX" defaultValue={ref} required autoComplete="off" />
              </div>
              <div className="field">
                <label htmlFor="code">Verification code</label>
                <input id="code" name="code" className="input" placeholder="XXXX-XXXX" defaultValue={code} required autoComplete="off" />
              </div>
              <button className="btn btn-primary">Verify letter</button>
            </form>

            {asked && current && (
              <div className="panel verify-ok" role="status">
                <div className="panel-h">
                  <h2>Authentic letter of admission</h2>
                  <span className="pill ok">{standing[found!.status]}</span>
                </div>
                <dl className="kv panel-b">
                  <dt>Issued to</dt>
                  <dd>{name}</dd>
                  <dt>Programme</dt>
                  <dd>{found!.data.major && found!.data.major !== "Undecided" ? found!.data.major : "Undeclared major"}, {programme.startTerm}</dd>
                  <dt>Award</dt>
                  <dd>{programme.name}</dd>
                  <dt>Date of issue</dt>
                  <dd>{fmtDate(found!.issued_at)}</dd>
                </dl>
              </div>
            )}
            {asked && found && !current && (
              <div className="alert alert-err" role="status">
                This letter was issued by the University but has since been withdrawn, and is no longer valid.
              </div>
            )}
            {asked && !found && (
              <div className="alert alert-err" role="status">
                No letter matches these details. Check the reference and code exactly as printed. A letter that cannot be verified here was not issued by {programme.university}.
              </div>
            )}
            <p className="small muted">
              {programme.university} does not charge candidates for any part of admission or enrolment. A letter accompanied by a request for payment is not genuine.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
