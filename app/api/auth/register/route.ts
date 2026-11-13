import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { badOrigin, createSession, fail, newReference } from "@/lib/auth";
import { programme } from "@/lib/content";
import { alertOffice, sendEmail } from "@/lib/email";

const Body = z.object({
  first_name: z.string().trim().min(1).max(80),
  last_name: z.string().trim().min(1).max(80),
  email: z.string().trim().toLowerCase().email().max(160),
  password: z.string().min(8).max(200),
  eligibility: z.object({
    country: z.literal("yes"),
    school: z.enum(["yes", "soon"]),
    need: z.literal("yes"),
    degree: z.literal("no"),
    age: z.literal("yes"),
  }),
});

export async function POST(req: Request) {
  if (badOrigin(req)) return fail(403, "Request blocked");
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0];
    return fail(400, field === "password" ? "Use at least 8 characters for your password" : field === "email" ? "Enter a valid email address" : "Check the highlighted details", { field });
  }
  const b = parsed.data;
  const q = await db();
  const exists = await q.query("select 1 from applicants where email = $1", [b.email]);
  if (exists.rows.length) return fail(409, "An application already exists for this email. Sign in to continue it.", { field: "email" });

  const hash = await bcrypt.hash(b.password, 10);
  const reference = newReference(programme.cycleCode);
  const id = await q.tx(async (t) => {
    const a = await t.query<{ id: string }>(
      "insert into applicants (email, first_name, last_name, password_hash) values ($1, $2, $3, $4) returning id",
      [b.email, b.first_name, b.last_name, hash],
    );
    const applicantId = a.rows[0].id;
    const app = await t.query<{ id: string }>(
      "insert into applications (applicant_id, reference, cycle, eligibility, data) values ($1, $2, $3, $4, $5) returning id",
      [applicantId, reference, programme.cycleCode, JSON.stringify(b.eligibility), JSON.stringify({ first_name: b.first_name, last_name: b.last_name })],
    );
    await t.query("insert into status_events (application_id, status, note) values ($1, 'draft', 'Application started')", [app.rows[0].id]);
    return applicantId;
  });
  await createSession(id);
  await sendEmail({ kind: "welcome", to: b.email, applicantId: id, params: { name: b.first_name, reference } });
  await alertOffice("office_signup", { name: `${b.first_name} ${b.last_name}`, email: b.email, reference });
  return NextResponse.json({ ok: true });
}
