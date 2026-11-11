import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { badOrigin, fail } from "@/lib/auth";
import { audit, requireStaffApi } from "@/lib/staff";
import { emailConfigured, resend } from "@/lib/email";

const Body = z.union([z.object({ id: z.string().regex(/^[0-9a-f-]{36}$/i) }), z.object({ all: z.literal(true) })]);

/** Resends one logged email, or every email that has not gone out yet. */
export async function POST(req: Request) {
  if (badOrigin(req)) return fail(403, "Request blocked");
  const me = await requireStaffApi({ decide: true });
  if (!me) return fail(403, "Only the committee chair or owner can resend emails");
  if (!emailConfigured()) return fail(409, "Email is not set up yet. Add the Resend settings first, then resend.");
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(400, "Choose an email to resend");
  let ids: string[];
  if ("id" in parsed.data) ids = [parsed.data.id];
  else {
    const q = await db();
    const { rows } = await q.query<{ id: string }>("select id from emails where status in ('failed', 'skipped') and kind <> 'password_reset' order by created_at limit 500");
    ids = rows.map((r) => r.id);
  }
  let queued = 0;
  for (const id of ids) if (await resend(id)) queued++;
  await audit(me.id, "emails_resent", null, `${queued} email${queued === 1 ? "" : "s"}`);
  return NextResponse.json({ ok: true, queued });
}
