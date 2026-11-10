import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { badOrigin, fail } from "@/lib/auth";
import { audit, createStaffSession, setupToken } from "@/lib/staff";

const Body = z.object({
  token: z.string().min(1),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(160),
  password: z.string().min(12).max(200),
});

/** Creates the first owner. Works only while there are no staff accounts, and only with ADMIN_SETUP_TOKEN. */
export async function POST(req: Request) {
  if (badOrigin(req)) return fail(403, "Request blocked");
  const expected = setupToken();
  if (!expected) return fail(503, "Setup is not enabled on this server");
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const f = parsed.error.issues[0]?.path[0];
    return fail(400, f === "password" ? "Use at least 12 characters for the password" : f === "email" ? "Enter a valid email" : "Check the details", { field: f });
  }
  const b = parsed.data;
  const a = Buffer.from(b.token);
  const e = Buffer.from(expected);
  if (a.length !== e.length || !timingSafeEqual(a, e)) return fail(403, "That setup token is not correct", { field: "token" });
  const q = await db();
  const id = await q.tx(async (t) => {
    const n = await t.query<{ n: number }>("select count(*)::int as n from staff");
    if (Number(n.rows[0].n) > 0) return null;
    const r = await t.query<{ id: string }>(
      "insert into staff (email, name, role, password_hash) values ($1, $2, 'owner', $3) returning id",
      [b.email, b.name, await bcrypt.hash(b.password, 11)],
    );
    await audit(r.rows[0].id, "setup", b.email, "First owner created", t);
    return r.rows[0].id;
  });
  if (!id) return fail(409, "The committee console is already set up. Sign in instead.");
  await createStaffSession(id);
  return NextResponse.json({ ok: true, next: "/committee/mfa?setup=1" });
}
