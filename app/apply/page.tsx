import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/Chrome";
import AuthSide from "@/components/AuthSide";
import AuthAside from "@/components/AuthAside";
import { currentApplicant } from "@/lib/auth";
import { programme } from "@/lib/content";
import ApplyStart from "./ApplyStart";

export const metadata = { title: "Apply" };
export const dynamic = "force-dynamic";

export default async function ApplyPage({ searchParams }: { searchParams: Promise<{ level?: string }> }) {
  if (await currentApplicant()) redirect("/portal");
  const { level } = await searchParams;
  return (
    <>
      <SiteHeader />
      <main id="main" className="authx">
        <AuthSide eyebrow={`${programme.name} · ${programme.cycle}`} title="Start your application" />
        <div className="authx-main">
          <ApplyStart initialLevel={typeof level === "string" ? level : undefined} />
          <AuthAside current={1} />
        </div>
      </main>
    </>
  );
}
