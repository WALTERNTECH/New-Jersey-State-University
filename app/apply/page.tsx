import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/Chrome";
import { currentApplicant } from "@/lib/auth";
import { programme } from "@/lib/content";
import ApplyStart from "./ApplyStart";

export const metadata = { title: "Apply" };
export const dynamic = "force-dynamic";

export default async function ApplyPage() {
  if (await currentApplicant()) redirect("/portal");
  return (
    <>
      <SiteHeader />
      <main id="main" className="auth">
        <div className="wrap">
          <div className="aside">
            <span className="eyebrow">{programme.name}</span>
            <h1>Start your application</h1>
            <p className="lede">A minute to check you qualify, then straight into your application. There is no fee at any stage.</p>
            <div className="points">
              <div>
                <i className="tick">1</i>
                <div>
                  <b>Saves automatically</b>
                  <p>Every answer is kept as you type. Sign in from any device to continue.</p>
                </div>
              </div>
              <div>
                <i className="tick">2</i>
                <div>
                  <b>Only what we need</b>
                  <p>Six short sections, two essays and two documents. Optional documents can follow after you submit.</p>
                </div>
              </div>
              <div>
                <i className="tick">3</i>
                <div>
                  <b>Always know where you stand</b>
                  <p>Your portal shows each stage of the review, through to your decision on {programme.decisions}.</p>
                </div>
              </div>
            </div>
          </div>
          <ApplyStart />
        </div>
      </main>
    </>
  );
}
