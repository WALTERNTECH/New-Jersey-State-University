import Link from "next/link";
import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { db } from "@/lib/db";
import { seal, unseal } from "@/lib/auth";
import { currentStaff } from "@/lib/staff";
import { base32, newSecret, otpauthUri } from "@/lib/totp";
import { CodeForm } from "@/components/committee/AuthForms";
import AuthCard from "../AuthCard";

export const metadata = { title: "Verify" };
export const dynamic = "force-dynamic";

export default async function CommitteeMfa() {
  const me = await currentStaff();
  if (!me) redirect("/committee/signin");
  if (me.mfa_ok) redirect(me.must_change ? "/committee/account?first=1" : "/committee");

  if (me.mfa_enabled) {
    return (
      <AuthCard title="Enter your code" sub="Open your authenticator app and enter the 6-digit code for NJSU Committee.">
        <CodeForm label="6-digit code" />
        <p className="small muted center mt24">
          Lost your phone? Ask the console owner to reset your sign-in. <Link href="/committee/signin">Start again</Link>
        </p>
      </AuthCard>
    );
  }

  // First sign-in: show a set-up code, keeping the same one across reloads until it is confirmed.
  const q = await db();
  const { rows } = await q.query<{ totp_pending: Uint8Array | null }>("select totp_pending from staff where id = $1", [me.id]);
  let secret: Buffer;
  if (rows[0]?.totp_pending) secret = unseal(Buffer.from(rows[0].totp_pending));
  else {
    secret = newSecret();
    await q.query("update staff set totp_pending = $2 where id = $1", [me.id, seal(secret)]);
  }
  const uri = otpauthUri(secret, me.email);
  const svg = await QRCode.toString(uri, { type: "svg", margin: 0, color: { dark: "#06243c", light: "#ffffff" } });
  const key = base32(secret).replace(/(.{4})/g, "$1 ").trim();

  return (
    <AuthCard title="Protect your account" sub="Committee accounts can see applicants' documents, so every sign-in needs a code from an authenticator app.">
      <ol className="small" style={{ paddingLeft: 18, margin: "18px 0", display: "grid", gap: 6, color: "var(--ink-2)" }}>
        <li>Install Google Authenticator, Microsoft Authenticator or 1Password on your phone.</li>
        <li>Scan this code, or type the key below.</li>
        <li>Enter the 6-digit code the app shows.</li>
      </ol>
      <div className="c-qr" dangerouslySetInnerHTML={{ __html: svg }} />
      <p className="c-secret mt16" aria-label="Set-up key">{key}</p>
      <div className="mt24">
        <CodeForm label="Code from your app" />
      </div>
    </AuthCard>
  );
}
