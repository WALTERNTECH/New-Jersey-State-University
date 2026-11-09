import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/Chrome";
import { currentApplicant } from "@/lib/auth";
import { applicationFor, documentsFor } from "@/lib/application";
import Wizard from "./Wizard";

export const metadata = { title: "Your application", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function ApplicationPage({ searchParams }: { searchParams: Promise<{ step?: string }> }) {
  const me = await currentApplicant();
  if (!me) redirect("/signin");
  const app = await applicationFor(me.id);
  if (!app) redirect("/apply");
  if (app.status !== "draft") redirect("/portal");
  const docs = await documentsFor(app.id);
  const { step } = await searchParams;
  return (
    <>
      <SiteHeader portal />
      <main id="main">
        <Wizard initial={app.data} initialDocs={docs} email={me.email} reference={app.reference} firstStep={step ?? "personal"} />
      </main>
    </>
  );
}
