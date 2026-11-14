import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { badOrigin, createSession, fail } from "@/lib/auth";
import { logAccess } from "@/lib/access";

// A real hash to compare against when the email is unknown, so timing does not reveal accounts.
const DUMMY = bcrypt.hashSync("not-a-real-password", 10);

export async function POST(req: Request) {
  if (badOrigin(req)) return fail(403, "Request blocked");
  const body = (await req.json().catch(() => null)) as { email?: string; password?: string } | null;
  const email = String(body?.email ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");
  if (!email || !password) return fail(400, "Enter your email and password");

  const q = await db();
  const { rows } = await q.query<{ id: string; password_hash: string; locked: boolean; must_change: boolean }>(
    "select id, password_hash, must_change, coalesce(locked_until > now(), false) as locked from applicants where email = $1",
    [email],
  );
  const a = rows[0];
  if (a?.locked) return fail(429, "For your security, sign-in has been paused after several unsuccessful attempts. Please try again in 15 minutes.");
  const ok = await bcrypt.compare(password, a?.password_hash ?? DUMMY);
  if (!a || !ok) {
    if (a) {
      // Eight misses lock the account for 15 minutes and reset the counter.
      await q.query(
        `update applicants set
           locked_until = case when failed_logins + 1 >= 8 then now() + interval '15 minutes' else locked_until end,
           failed_logins = case when failed_logins + 1 >= 8 then 0 else failed_logins + 1 end
         where id = $1`,
        [a.id],
      );
    }
    return fail(401, "The email address or password is incorrect.");
  }
  await q.query("update applicants set failed_logins = 0, locked_until = null where id = $1", [a.id]);
  await createSession(a.id);
  await logAccess("signin", { applicantId: a.id });
  return NextResponse.json({ ok: true, next: a.must_change ? "/portal/password?required=1" : null });
}
