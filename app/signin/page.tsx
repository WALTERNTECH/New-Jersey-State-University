import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/Chrome";
import { currentApplicant } from "@/lib/auth";
import { programme } from "@/lib/content";
import SignInForm from "./SignInForm";

export const metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default async function SignInPage() {
  if (await currentApplicant()) redirect("/portal");
  return (
    <>
      <SiteHeader />
      <main id="main" className="auth">
        <div className="wrap">
          <div className="aside">
            <span className="eyebrow">Applicant portal</span>
            <h1>Welcome back</h1>
            <p className="lede">
              Sign in to continue your application, add documents or check the status of your {programme.name} application.
            </p>
          </div>
          <SignInForm />
        </div>
      </main>
    </>
  );
}
