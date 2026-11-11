import { SiteHeader } from "@/components/Chrome";
import AuthSide from "@/components/AuthSide";
import { emailConfigured } from "@/lib/email";
import { programme } from "@/lib/content";
import ForgotForm from "./ForgotForm";

export const metadata = { title: "Reset your password" };
export const dynamic = "force-dynamic";

export default function ForgotPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="authx">
        <AuthSide
          eyebrow="Applicant portal"
          title="Reset your password"
          body="Enter the email address on your application and we will send you a link to choose a new password."
          points={["The link works once", "It expires after 30 minutes", "Your application is unaffected"]}
        />
        <div className="authx-main">
          <ForgotForm enabled={emailConfigured()} contactEmail={programme.contactEmail} />
        </div>
      </main>
    </>
  );
}
