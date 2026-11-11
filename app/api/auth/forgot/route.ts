import { NextResponse } from "next/server";
import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { badOrigin, fail } from "@/lib/auth";
import { emailConfigured, sendEmail } from "@/lib/email";

const Body = z.object({ email: z.string().trim().toLowerCase().email().max(160) });

/** Emails a one-time reset link. The answer is the same whether or not the address has an account. */
export async function POST(req: Request) {
  if (badOrigin(req)) return fail(403, "Request blocked");
  if (!emailConfigured()) return fail(503, "Password reset by email is not available yet. Please contact the Office of Admissions.");
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(400, "Enter a valid email address");
  const q = await db();
  const { rows } = await q.query<{ id: string; first_name: string }>("select id, first_name from applicants where email = $1", [parsed.data.email]);
  const a = rows[0];
  if (a) {
    const recent = await q.query<{ n: number }>("select count(*)::int as n from password_resets where applicant_id = $1 and created_at > now() - interval '1 hour'", [a.id]);
    if (Number(recent.rows[0].n) < 3) {
      const token = randomBytes(32).toString("base64url");
      await q.query("insert into password_resets (token_hash, applicant_id, expires_at) values ($1, $2, now() + interval '30 minutes')", [
        createHash("sha256").update(token).digest("hex"),
        a.id,
      ]);
      await sendEmail({ kind: "password_reset", to: parsed.data.email, applicantId: a.id, params: { name: a.first_name }, secret: { reset_path: `/reset?token=${token}` } });
    }
  }
  return NextResponse.json({ ok: true });
}
