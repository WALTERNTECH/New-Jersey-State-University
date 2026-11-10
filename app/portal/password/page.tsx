import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/Chrome";
import ApplicantPassword from "@/components/portal/ApplicantPassword";
import { currentApplicant } from "@/lib/auth";

export const metadata = { title: "Change password", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function PasswordPage({ searchParams }: { searchParams: Promise<{ required?: string }> }) {
  const me = await currentApplicant();
  if (!me) redirect("/signin");
  const required = (await searchParams).required === "1";
  return (
    <>
      <SiteHeader portal />
      <main id="main" className="auth">
        <div className="wrap" style={{ gridTemplateColumns: "minmax(0, 1fr)", maxWidth: 560 }}>
          <div className="card">
            <h2>{required ? "Choose a new password" : "Change your password"}</h2>
            <p className="sub">
              {required
                ? "You signed in with a temporary password issued by the Office of Admissions. Please replace it before continuing."
                : "Signing in with a new password will sign you out on every other device."}
            </p>
            <ApplicantPassword required={required} />
          </div>
        </div>
      </main>
    </>
  );
}
