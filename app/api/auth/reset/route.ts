import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { badOrigin, fail } from "@/lib/auth";

const Body = z.object({ token: z.string().min(20).max(200), password: z.string().min(8).max(200) });

/** Sets a new password from a reset link, then signs the account out everywhere. */
export async function POST(req: Request) {
  if (badOrigin(req)) return fail(403, "Request blocked");
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(400, parsed.error.issues[0]?.path[0] === "password" ? "Use at least 8 characters for your password" : "This link is not valid");
  const hash = createHash("sha256").update(parsed.data.token).digest("hex");
  const pw = await bcrypt.hash(parsed.data.password, 10);
  const q = await db();
  const ok = await q.tx(async (t) => {
    const { rows } = await t.query<{ applicant_id: string }>(
      "select applicant_id from password_resets where token_hash = $1 and used_at is null and expires_at > now() for update",
      [hash],
    );
    if (!rows[0]) return false;
    const id = rows[0].applicant_id;
    await t.query("update applicants set password_hash = $2, must_change = false, failed_logins = 0, locked_until = null where id = $1", [id, pw]);
    await t.query("update password_resets set used_at = now() where applicant_id = $1 and used_at is null", [id]);
    await t.query("delete from sessions where applicant_id = $1", [id]);
    return true;
  });
  if (!ok) return fail(400, "This link has expired or has already been used. Please request a new one.");
  return NextResponse.json({ ok: true });
}
