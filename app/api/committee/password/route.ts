import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { badOrigin, fail } from "@/lib/auth";
import { audit, requireStaffApi } from "@/lib/staff";

export async function POST(req: Request) {
  if (badOrigin(req)) return fail(403, "Request blocked");
  const me = await requireStaffApi();
  if (!me) return fail(401, "Sign in again");
  const body = (await req.json().catch(() => null)) as { current?: string; next?: string } | null;
  const next = String(body?.next ?? "");
  if (next.length < 12) return fail(400, "Use at least 12 characters", { field: "next" });
  const q = await db();
  const { rows } = await q.query<{ password_hash: string }>("select password_hash from staff where id = $1", [me.id]);
  if (!(await bcrypt.compare(String(body?.current ?? ""), rows[0].password_hash))) return fail(400, "Your current password is not correct", { field: "current" });
  if (await bcrypt.compare(next, rows[0].password_hash)) return fail(400, "Choose a password you haven't used here", { field: "next" });
  await q.query("update staff set password_hash = $2, must_change = false where id = $1", [me.id, await bcrypt.hash(next, 11)]);
  await audit(me.id, "password_changed");
  return NextResponse.json({ ok: true });
}
