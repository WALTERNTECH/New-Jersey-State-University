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
        />
        <div className="authx-main">
          <ResetForm token={token} />
        </div>
      </main>
    </>
  );
}
