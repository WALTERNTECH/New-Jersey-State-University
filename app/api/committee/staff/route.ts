import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { badOrigin, fail } from "@/lib/auth";
import { audit, requireStaffApi, tempPassword } from "@/lib/staff";

const Body = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(160),
  role: z.enum(["owner", "chair", "reviewer"]),
});

/** Owner adds a committee member. They get a one-time password, shown once, and must change it and set up their authenticator. */
export async function POST(req: Request) {
  if (badOrigin(req)) return fail(403, "Request blocked");
  const me = await requireStaffApi({ owner: true });
  if (!me) return fail(403, "Only the owner can add committee members");
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(400, "Check the name, email and role", { field: parsed.error.issues[0]?.path[0] });
  const b = parsed.data;
  const q = await db();
  const exists = await q.query("select 1 from staff where email = $1", [b.email]);
  if (exists.rows.length) return fail(409, "There is already a committee account with this email", { field: "email" });
  const password = tempPassword();
  const { rows } = await q.query<{ id: string }>(
    "insert into staff (email, name, role, password_hash, must_change) values ($1, $2, $3, $4, true) returning id",
    [b.email, b.name, b.role, await bcrypt.hash(password, 11)],
  );
  await audit(me.id, "staff_added", b.email, b.role);
  return NextResponse.json({ id: rows[0].id, password });
}
