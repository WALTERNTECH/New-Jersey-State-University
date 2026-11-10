import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { badOrigin, fail } from "@/lib/auth";
import { audit, requireStaffApi, tempPassword } from "@/lib/staff";

type Ctx = { params: Promise<{ id: string }> };

/** Owner changes a member's role, turns their access off or on, or resets their sign-in. */
export async function PATCH(req: Request, { params }: Ctx) {
  if (badOrigin(req)) return fail(403, "Request blocked");
  const me = await requireStaffApi({ owner: true });
  if (!me) return fail(403, "Only the owner can change committee accounts");
  const { id } = await params;
  const body = (await req.json().catch(() => null)) as { role?: string; disabled?: boolean; reset?: boolean } | null;
  if (!body) return fail(400, "Nothing to change");
  const q = await db();
  const { rows } = await q.query<{ email: string; role: string }>("select email, role from staff where id = $1", [id]).catch(() => ({ rows: [] as { email: string; role: string }[] }));
  const target = rows[0];
  if (!target) return fail(404, "Not found");

  const owners = Number((await q.query<{ n: number }>("select count(*)::int as n from staff where role = 'owner' and not disabled")).rows[0].n);
  const losingOwner = target.role === "owner" && ((body.role && body.role !== "owner") || body.disabled === true);
  if (losingOwner && owners <= 1) return fail(409, "Keep at least one active owner");
  if (id === me.id && (body.disabled || body.reset)) return fail(409, "Use your own account page to change your sign-in");

  if (body.role) {
    if (!["owner", "chair", "reviewer"].includes(body.role)) return fail(400, "Unknown role");
    await q.query("update staff set role = $2 where id = $1", [id, body.role]);
    await audit(me.id, "staff_role", target.email, body.role);
  }
  if (typeof body.disabled === "boolean") {
    await q.query("update staff set disabled = $2 where id = $1", [id, body.disabled]);
    if (body.disabled) await q.query("delete from staff_sessions where staff_id = $1", [id]);
    await audit(me.id, body.disabled ? "staff_disabled" : "staff_enabled", target.email);
  }
  if (body.reset) {
    const password = tempPassword();
    await q.query(
      "update staff set password_hash = $2, must_change = true, totp_secret = null, totp_pending = null, totp_last_step = 0, failed_logins = 0, locked_until = null where id = $1",
      [id, await bcrypt.hash(password, 11)],
    );
    await q.query("delete from staff_sessions where staff_id = $1", [id]);
    await audit(me.id, "staff_reset", target.email);
    return NextResponse.json({ ok: true, password });
  }
  return NextResponse.json({ ok: true });
}
