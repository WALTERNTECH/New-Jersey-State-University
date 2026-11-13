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
        />
        <div className="authx-main">
          <ForgotForm enabled={emailConfigured()} contactEmail={programme.contactEmail} />
        </div>
      </main>
    </>
  );
}
