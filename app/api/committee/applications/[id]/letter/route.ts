import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { badOrigin, fail } from "@/lib/auth";
import { audit, requireStaffApi } from "@/lib/staff";
import { letterFor, letterIsCurrent, letterPdf } from "@/lib/letter";
import { sendEmail } from "@/lib/email";

type Ctx = { params: Promise<{ id: string }> };
const uuid = /^[0-9a-f-]{36}$/i;

/** The committee's copy of a candidate's letter of admission. */
export async function GET(_req: Request, { params }: Ctx) {
  const me = await requireStaffApi();
  if (!me) return fail(401, "Sign in again");
  const { id } = await params;
  if (!uuid.test(id)) return fail(404, "Not found");
  const pdf = await letterPdf(id);
  if (!pdf) return fail(404, "There is no current letter of admission for this application");
  await audit(me.id, "view_letter", pdf.filename.replace(/^NJSU-Letter-of-Admission-|\.pdf$/g, ""));
  return new NextResponse(new Uint8Array(pdf.bytes), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${pdf.filename}"`, "Cache-Control": "private, no-store" },
  });
}

/** Emails the letter to the candidate again. */
export async function POST(req: Request, { params }: Ctx) {
  if (badOrigin(req)) return fail(403, "Request blocked");
  const me = await requireStaffApi({ decide: true });
  if (!me) return fail(403, "Only the committee chair or owner can send letters");
  const { id } = await params;
  if (!uuid.test(id)) return fail(404, "Not found");
  const l = await letterFor(id);
  if (!letterIsCurrent(l)) return fail(409, "There is no current letter of admission for this application");
  const q = await db();
  const { rows } = await q.query<{ email: string; applicant_id: string; first_name: string }>(
    "select p.email, p.id as applicant_id, p.first_name from applications a join applicants p on p.id = a.applicant_id where a.id = $1",
    [id],
  );
  const name = (l!.data.preferred_name || l!.data.first_name || rows[0].first_name).trim();
  await sendEmail({ kind: "awarded", to: rows[0].email, applicantId: rows[0].applicant_id, params: { name, reference: l!.reference, application_id: id } });
  await audit(me.id, "letter_sent", l!.reference);
  return NextResponse.json({ ok: true });
}
