import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { badOrigin, fail, seal, unseal } from "@/lib/auth";
import { audit, currentStaff, markMfa } from "@/lib/staff";
import { verifyTotp } from "@/lib/totp";
import { logAccess } from "@/lib/access";

/** Second step of sign-in. If the account has no authenticator yet, the code confirms the pending one. */
export async function POST(req: Request) {
  if (badOrigin(req)) return fail(403, "Request blocked");
  const me = await currentStaff();
  if (!me) return fail(401, "Your sign-in has expired. Start again.");
  const body = (await req.json().catch(() => null)) as { code?: string } | null;
  const q = await db();
  const { rows } = await q.query<{ totp_secret: Uint8Array | null; totp_pending: Uint8Array | null; totp_last_step: number; must_change: boolean }>(
    "select totp_secret, totp_pending, totp_last_step, must_change from staff where id = $1",
    [me.id],
  );
  const r = rows[0];
  const enrolling = !r.totp_secret;
  const sealed = r.totp_secret ?? r.totp_pending;
  if (!sealed) return fail(400, "Reload the page to get a new set-up code");
  const secret = unseal(Buffer.from(sealed));
  const step = verifyTotp(secret, String(body?.code ?? ""), Number(r.totp_last_step));
  if (step === null) {
    await audit(me.id, "mfa_failed");
    return fail(401, "That code didn't match. Check your authenticator app and try the newest code.");
  }
  if (enrolling) {
    await q.query("update staff set totp_secret = $2, totp_pending = null, totp_last_step = $3 where id = $1", [me.id, seal(secret), step]);
    await audit(me.id, "mfa_enrolled");
  } else {
    await q.query("update staff set totp_last_step = $2 where id = $1", [me.id, step]);
  }
  await markMfa();
  await audit(me.id, "signin");
  await logAccess("staff_signin", { staffId: me.id });
  return NextResponse.json({ ok: true, next: r.must_change ? "/committee/account?first=1" : "/committee" });
}
