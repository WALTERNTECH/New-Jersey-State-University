import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { badOrigin, fail } from "@/lib/auth";
import { audit, createStaffSession } from "@/lib/staff";

const DUMMY = bcrypt.hashSync("not-a-real-password", 11);

export async function POST(req: Request) {
  if (badOrigin(req)) return fail(403, "Request blocked");
  const body = (await req.json().catch(() => null)) as { email?: string; password?: string } | null;
  const email = String(body?.email ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");
  if (!email || !password) return fail(400, "Enter your email and password");

  const q = await db();
  const { rows } = await q.query<{ id: string; password_hash: string; locked: boolean; disabled: boolean; mfa: boolean }>(
    `select id, password_hash, coalesce(locked_until > now(), false) as locked, disabled, (totp_secret is not null) as mfa
     from staff where email = $1`,
    [email],
  );
  const s = rows[0];
  if (s?.locked) return fail(429, "Too many attempts. Try again in 15 minutes.");
  const ok = await bcrypt.compare(password, s?.password_hash ?? DUMMY);
  if (!s || !ok || s.disabled) {
    if (s) {
      await q.query(
        `update staff set
           locked_until = case when failed_logins + 1 >= 6 then now() + interval '15 minutes' else locked_until end,
           failed_logins = case when failed_logins + 1 >= 6 then 0 else failed_logins + 1 end
         where id = $1`,
        [s.id],
      );
      await audit(s.id, "signin_failed", email);
    }
    return fail(401, "That email and password don't match a committee account");
  }
  await q.query("update staff set failed_logins = 0, locked_until = null where id = $1", [s.id]);
  await createStaffSession(s.id);
  return NextResponse.json({ ok: true, next: s.mfa ? "/committee/mfa" : "/committee/mfa?setup=1" });
}
