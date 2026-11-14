import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { badOrigin, currentApplicant, endOtherSessions, fail } from "@/lib/auth";
import { logAccess } from "@/lib/access";

/** An applicant changes their password, including replacing a temporary one issued by the Office. */
export async function POST(req: Request) {
  if (badOrigin(req)) return fail(403, "Request blocked");
  const me = await currentApplicant();
  if (!me) return fail(401, "Please sign in to continue");
  const body = (await req.json().catch(() => null)) as { current?: string; next?: string } | null;
  const next = String(body?.next ?? "");
  if (next.length < 8) return fail(400, "Please use at least 8 characters", { field: "next" });
  const q = await db();
  const { rows } = await q.query<{ password_hash: string }>("select password_hash from applicants where id = $1", [me.id]);
  if (!(await bcrypt.compare(String(body?.current ?? ""), rows[0].password_hash))) return fail(400, "Your current password is incorrect", { field: "current" });
  if (await bcrypt.compare(next, rows[0].password_hash)) return fail(400, "Please choose a new password", { field: "next" });
  await q.query("update applicants set password_hash = $2, must_change = false where id = $1", [me.id, await bcrypt.hash(next, 10)]);
  await endOtherSessions(me.id);
  await logAccess("password_changed", { applicantId: me.id });
  return NextResponse.json({ ok: true });
}
