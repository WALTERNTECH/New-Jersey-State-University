import { requireStaffPage, roleLabels } from "@/lib/staff";
import { PasswordForm } from "@/components/committee/StaffAdmin";

export const metadata = { title: "Your account" };
export const dynamic = "force-dynamic";

export default async function Account({ searchParams }: { searchParams: Promise<{ first?: string }> }) {
  const me = await requireStaffPage({ allowMustChange: true });
  const first = me.must_change || (await searchParams).first === "1";
  return (
    <>
      <div className="c-head">
        <div>
          <h1>{first ? "Choose your password" : "Your account"}</h1>
          <p>{me.name} · {me.email} · {roleLabels[me.role]}</p>
        </div>
      </div>
      <div className="c-grid c-cols-2">
        <section className="c-card">
          <div className="c-card-h"><h2>{first ? "Replace your one-time password" : "Password"}</h2></div>
          <div className="c-card-b">
            <PasswordForm first={me.must_change} />
          </div>
        </section>
        <section className="c-card">
          <div className="c-card-h"><h2>Two-step sign-in</h2></div>
          <div className="c-card-b stack" style={{ gap: 10 }}>
            <p><span className="c-st awarded">On</span></p>
            <p className="muted">
              Every sign-in asks for a code from your authenticator app. If you lose your phone, ask an owner to reset your sign-in; you will set up the app again.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
