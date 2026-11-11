import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/Chrome";
import PrintButton from "@/components/PrintButton";
import { requireApplicant } from "@/lib/auth";
import { applicationFor, documentsFor } from "@/lib/application";
import { programme } from "@/lib/content";
import { documentKinds } from "@/lib/form";
import { fmtDate } from "@/lib/client";

export const metadata = { title: "Application submitted", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function Submitted() {
  const me = await requireApplicant("/portal");
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
            Your application for the {programme.name} has been received by the Office of Admissions. Please quote your application reference in any correspondence.
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
            <h2>Next steps</h2>
            <ol>
              {missingOptional.length > 0 && (
                <li>
                  <div>
                    <b>Submit any supplementary documents</b>
                    <p>
                      Your {missingOptional.map((k) => (k.kind === "english" ? k.label : k.label.toLowerCase())).join(" and ")} may still be added through the applicant portal and will strengthen your application.
                    </p>
                    <p className="when">Within 14 days</p>
                  </div>
                </li>
              )}
              <li>
                <div>
                  <b>Committee review</b>
                  <p>
                    The Scholarship Committee will review your application and verify your academic documents. Your status will change to “Under review” when this
                    begins, and we will confirm it by email.
                  </p>
                  <p className="when">Within 3 weeks of the deadline</p>
                </div>
              </li>
              <li>
                <div>
                  <b>Interviews</b>
                  <p>Shortlisted candidates are invited to a 30-minute conversation with members of the Scholarship Committee, held by video at a mutually convenient time.</p>
                  <p className="when">{programme.interviews}</p>
                </div>
              </li>
              <li>
                <div>
                  <b>Admission decision</b>
                  <p>Decisions are released in the applicant portal and sent to {me.email}. Admitted scholars receive their letter of admission by email, with the terms of their award and guidance on enrolment and travel.</p>
                  <p className="when">By {programme.decisions}</p>
                </div>
              </li>
            </ol>
          </div>

          <div className="flex mt32" style={{ justifyContent: "center" }}>
            <Link href="/portal" className="btn btn-primary">
              Return to the applicant portal
            </Link>
            <PrintButton />
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
