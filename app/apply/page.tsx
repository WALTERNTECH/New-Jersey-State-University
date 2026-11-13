import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/Chrome";
import AuthSide from "@/components/AuthSide";
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
      <main id="main" className="authx">
        <AuthSide eyebrow={`${programme.name} · ${programme.cycle}`} title="Start your application" />
        <div className="authx-main">
          <ApplyStart />
        </div>
      </main>
    </>
  );
}
