import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { badOrigin, fail } from "@/lib/auth";
import { audit, requireStaffApi, tempPassword } from "@/lib/staff";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Issues a temporary password for an applicant who has lost access, after the Office has verified
 * their identity. Shown once to the staff member; the applicant must replace it at their next sign-in.
 */
export async function POST(req: Request, { params }: Ctx) {
  if (badOrigin(req)) return fail(403, "Request blocked");
  const me = await requireStaffApi({ decide: true });
  if (!me) return fail(403, "Only the committee chair or owner can reset an applicant's password");
  const { id } = await params;
  const q = await db();
  const { rows } = await q.query<{ applicant_id: string; reference: string }>("select applicant_id, reference from applications where id = $1", [id]).catch(
    () => ({ rows: [] as { applicant_id: string; reference: string }[] }),
  );
  if (!rows[0]) return fail(404, "Not found");
  const password = tempPassword();
  await q.query("update applicants set password_hash = $2, must_change = true, failed_logins = 0, locked_until = null where id = $1", [
    rows[0].applicant_id,
    await bcrypt.hash(password, 10),
  ]);
  await q.query("delete from sessions where applicant_id = $1", [rows[0].applicant_id]);
  await audit(me.id, "applicant_reset", rows[0].reference);
  return NextResponse.json({ password });
}
