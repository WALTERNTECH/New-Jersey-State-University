import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { badOrigin, fail } from "@/lib/auth";
import { audit, requireStaffApi } from "@/lib/staff";
import { paymentFor } from "@/lib/payment";

type Ctx = { params: Promise<{ id: string }> };

/** Full bank details, for the chair or owner making a transfer. Every view is written to the activity log. */
export async function POST(req: Request, { params }: Ctx) {
  if (badOrigin(req)) return fail(403, "Request blocked");
  const me = await requireStaffApi({ decide: true });
  if (!me) return fail(403, "Only the committee chair or owner can view bank details");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return fail(404, "Not found");
  const q = await db();
  const { rows } = await q.query<{ reference: string }>("select reference from applications where id = $1", [id]);
  if (!rows[0]) return fail(404, "Not found");
  const details = await paymentFor(id);
  if (!details) return fail(404, "No payment details on file");
  await audit(me.id, "view_payment", rows[0].reference);
  return NextResponse.json({ details });
}
