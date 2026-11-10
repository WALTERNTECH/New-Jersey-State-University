import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/Chrome";
import AuthSide from "@/components/AuthSide";
import { currentApplicant } from "@/lib/auth";
import { programme } from "@/lib/content";
import SignInForm from "./SignInForm";

export const metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

const safeNext = (n?: string) => (n && n.startsWith("/portal") && !n.startsWith("//") ? n : "/portal");

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next);
  const me = await currentApplicant();
  if (me) redirect(me.must_change ? "/portal/password?required=1" : next);
  return (
    <>
      <SiteHeader />
      <main id="main" className="authx">
        <AuthSide
          eyebrow="Applicant portal"
          title="Welcome back"
          body={`Sign in to continue your application, follow the Committee’s review, or manage your ${programme.name} as an admitted scholar.`}
          points={["Your progress is saved automatically", "Follow each stage of the review", "Reply to your offer and request allowances"]}
        />
        <div className="authx-main">
          <SignInForm next={next} />
        </div>
      </main>
    </>
  );
}
