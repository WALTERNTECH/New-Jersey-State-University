import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { badOrigin, fail } from "@/lib/auth";
import { audit, canDecide, requireStaffApi } from "@/lib/staff";
import { nextStatuses } from "@/lib/committee";
import { statusLabels } from "@/lib/form";

type Ctx = { params: Promise<{ id: string }> };
const uuid = /^[0-9a-f-]{36}$/i;

export async function POST(req: Request, { params }: Ctx) {
  if (badOrigin(req)) return fail(403, "Request blocked");
  const me = await requireStaffApi();
  if (!me) return fail(401, "Sign in again");
  const { id } = await params;
  if (!uuid.test(id)) return fail(404, "Not found");
  const body = (await req.json().catch(() => null)) as { status?: string; note?: string } | null;
  const to = String(body?.status ?? "");
  const note = String(body?.note ?? "").trim().slice(0, 2000) || null;
  // Reviewers can open a review; moving to interview or a decision is for the chair or owner.
  if (to !== "under_review" && !canDecide(me)) return fail(403, "Only the committee chair or owner can make this change");

  const q = await db();
  const result = await q.tx(async (t) => {
    const { rows } = await t.query<{ status: string; reference: string }>("select status, reference from applications where id = $1 for update", [id]);
    if (!rows[0]) return { error: fail(404, "Not found") };
    const from = rows[0].status;
    if (!(nextStatuses[from] ?? []).includes(to as never)) return { error: fail(409, `An application that is ${statusLabels[from]?.toLowerCase() ?? from} can't move to ${statusLabels[to]?.toLowerCase() ?? to}`) };
    await t.query(
      "update applications set status = $2, updated_at = now(), enrolled_at = case when $2 = 'enrolled' then now() else enrolled_at end where id = $1",
      [id, to],
    );
    await t.query("insert into status_events (application_id, status, note, staff_id) values ($1, $2, $3, $4)", [id, to, note, me.id]);
    await audit(me.id, "status_change", rows[0].reference, `${statusLabels[from] ?? from} → ${statusLabels[to] ?? to}${note ? ` · ${note}` : ""}`, t);
    return { from };
  });
  if ("error" in result) return result.error;
  return NextResponse.json({ ok: true, status: to });
}
