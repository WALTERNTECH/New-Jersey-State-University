import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { badOrigin, currentApplicant, fail } from "@/lib/auth";
import { maybeClear } from "@/lib/stages";
import { alertOffice } from "@/lib/email";
import { phoneError } from "@/lib/form";

const Body = z.object({
  arrival_date: z.string().refine((v) => !Number.isNaN(Date.parse(v)), "date"),
  mode: z.enum(["Air", "Rail", "Road"]),
  arrival_point: z.string().trim().min(2).max(160),
  carrier: z.string().trim().max(160).optional().default(""),
  contact_name: z.string().trim().min(2).max(120),
  contact_phone: z.string().trim().max(30).refine((v) => !phoneError(v), "phone"),
  contact_relationship: z.string().trim().min(2).max(60),
});

/** The scholar's plan for reporting to campus. Enrolment itself is confirmed by the University on arrival. */
export async function POST(req: Request) {
  if (badOrigin(req)) return fail(403, "Request blocked");
  const me = await currentApplicant();
  if (!me) return fail(401, "Please sign in to continue");
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(400, "Please complete each required field", { field: parsed.error.issues[0]?.path[0] });
  const q = await db();
  const { rows } = await q.query<{ id: string; reference: string; data: Record<string, string> }>(
    "update applications set arrival = $2, updated_at = now() where applicant_id = $1 and status = 'accepted' returning id, reference, data",
    [me.id, JSON.stringify({ ...parsed.data, saved_at: new Date().toISOString() })],
  );
  if (!rows[0]) return fail(409, "Arrival plans can be submitted once you have accepted your offer, and until you have enrolled");
  await alertOffice("office_arrival", {
    name: [rows[0].data.first_name, rows[0].data.last_name].filter(Boolean).join(" ") || me.first_name,
    reference: rows[0].reference,
    date: new Date(parsed.data.arrival_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }),
    point: parsed.data.arrival_point,
  });
  const cleared = await maybeClear(rows[0].id);
  return NextResponse.json({ ok: true, cleared });
}
