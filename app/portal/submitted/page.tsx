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
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3">
              <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1>Application submitted</h1>
          <p className="lede">Thank you, {name}. Your application has been received.</p>

          <div className="receipt">
            <div>
              <span>Reference</span>
              <b className="mono">{app.reference}</b>
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
                    <b>Optional documents</b>
                    <p>{missingOptional.map((k) => k.label).join(", ")}</p>
                    <p className="when">Within 14 days</p>
                  </div>
                </li>
              )}
              <li>
                <div>
                  <b>Committee review</b>
                  <p className="when">Within 3 weeks of the deadline</p>
                </div>
              </li>
              <li>
                <div>
                  <b>Interviews</b>
                  <p className="when">{programme.interviews}</p>
                </div>
              </li>
              <li>
                <div>
                  <b>Admission decision</b>
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
