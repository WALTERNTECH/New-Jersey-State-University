import { SiteHeader } from "@/components/Chrome";
import AuthSide from "@/components/AuthSide";
import ResetForm from "./ResetForm";

export const metadata = { title: "Choose a new password", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function ResetPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const token = String((await searchParams).token ?? "").slice(0, 200);
  return (
    <>
      <SiteHeader />
      <main id="main" className="authx">
        <AuthSide
          eyebrow="Applicant portal"
          title="Choose a new password"
          body="Use at least 8 characters. You will be signed out on every other device."
          points={["Your application is unaffected", "Sign in with the new password afterwards"]}
        />
        <div className="authx-main">
          <ResetForm token={token} />
        </div>
      </main>
    </>
  );
}
