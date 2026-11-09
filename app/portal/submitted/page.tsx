import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/Chrome";
import PrintButton from "@/components/PrintButton";
import { currentApplicant } from "@/lib/auth";
import { applicationFor, documentsFor } from "@/lib/application";
import { programme } from "@/lib/content";
import { documentKinds } from "@/lib/form";
import { fmtDate } from "@/lib/client";

export const metadata = { title: "Application submitted", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function Submitted() {
  const me = await currentApplicant();
  if (!me) redirect("/signin");
  const app = await applicationFor(me.id);
  if (!app) redirect("/apply");
  if (app.status === "draft") redirect("/portal/application?step=review");
  const docs = await documentsFor(app.id);
  const missingOptional = documentKinds.filter((k) => !k.required && !docs.some((d) => d.kind === k.kind));
  const name = (app.data.preferred_name || app.data.first_name || me.first_name).trim();

  return (
    <>
      <SiteHeader portal />
      <main id="main" className="thanks">
        <div className="wrap-narrow">
          <div className="seal" aria-hidden>
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#eabb13" strokeWidth="2.4">
              <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1>Thank you, {name}.</h1>
          <p className="lede">
            Your application for the {programme.name} has been received. Keep your reference number; you will not need to pay anything at any stage.
          </p>

          <div className="receipt">
            <div>
              <span>Reference</span>
              <b className="ref" style={{ border: 0, padding: 0, fontSize: 15 }}>{app.reference}</b>
            </div>
            <div>
              <span>Submitted</span>
              <b>{fmtDate(app.submitted_at, true)}</b>
            </div>
            <div>
              <span>Programme</span>
              <b>{app.data.major || "Undecided"}, {programme.startTerm}</b>
            </div>
          </div>

          <div className="next">
            <h2>What happens next</h2>
            <ol>
              {missingOptional.length > 0 && (
                <li>
                  <div>
                    <b>Add any remaining documents</b>
                    <p>
                      You can still add your {missingOptional.map((k) => (k.kind === "english" ? k.label : k.label.toLowerCase())).join(" and ")} from your portal. They strengthen your application.
                    </p>
                    <p className="when">Within 14 days</p>
                  </div>
                </li>
              )}
              <li>
                <div>
                  <b>We verify your documents and contact your recommender</b>
                  <p>
                    We will email {app.data.rec_name || "your recommender"} directly. Your portal status changes to “Under review” once this begins.
                  </p>
                  <p className="when">Within 3 weeks of the deadline</p>
                </div>
              </li>
              <li>
                <div>
                  <b>Shortlisted applicants are invited to interview</b>
                  <p>A relaxed 30-minute video conversation with two members of the scholarship committee. We will agree a time that suits you.</p>
                  <p className="when">{programme.interviews}</p>
                </div>
              </li>
              <li>
                <div>
                  <b>You receive a decision</b>
                  <p>Decisions appear in your portal and are sent to {me.email}. Awarded scholars receive their enrolment and travel guidance.</p>
                  <p className="when">By {programme.decisions}</p>
                </div>
              </li>
            </ol>
          </div>

          <div className="flex mt32" style={{ justifyContent: "center" }}>
            <Link href="/portal" className="btn btn-primary">
              Go to your portal
            </Link>
            <PrintButton />
          </div>
          <p className="small muted center mt24">
            A message asking you to pay a fee to secure this scholarship did not come from {programme.university}.
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
