import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { setupToken } from "@/lib/staff";
import { SetupForm } from "@/components/committee/AuthForms";
import AuthCard from "../AuthCard";

export const metadata = { title: "Set up" };
export const dynamic = "force-dynamic";

export default async function CommitteeSetup() {
  const q = await db();
  const n = Number((await q.query<{ n: number }>("select count(*)::int as n from staff")).rows[0].n);
  if (n > 0 || !setupToken()) redirect("/committee/signin");
  return (
    <AuthCard title="Set up the committee console" sub="Create the first owner account. Owners add the other committee members from inside the console.">
      <SetupForm />
    </AuthCard>
  );
}
