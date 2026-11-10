import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { currentStaff, setupToken } from "@/lib/staff";
import { SignInForm } from "@/components/committee/AuthForms";
import AuthCard from "../AuthCard";

export const metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default async function CommitteeSignIn() {
  const me = await currentStaff();
  if (me?.mfa_ok) redirect("/committee");
  const q = await db();
  const n = Number((await q.query<{ n: number }>("select count(*)::int as n from staff")).rows[0].n);
  if (n === 0 && setupToken()) redirect("/committee/setup");
  return (
    <AuthCard title="Committee sign-in" sub="For members of the Access Scholarship committee. You will be asked for a code from your authenticator app.">
      <SignInForm />
      <p className="small muted center mt24">
        Applying for the scholarship? <Link href="/signin">Applicant sign-in</Link>
      </p>
    </AuthCard>
  );
}
