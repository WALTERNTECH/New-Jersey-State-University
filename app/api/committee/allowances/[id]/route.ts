import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { badOrigin, fail } from "@/lib/auth";
import { audit, requireStaffApi } from "@/lib/staff";

type Ctx = { params: Promise<{ id: string }> };

const moves: Record<string, { from: string[]; to: string }> = {
  approve: { from: ["submitted", "declined"], to: "approved" },
  decline: { from: ["submitted", "approved"], to: "declined" },
  disburse: { from: ["approved"], to: "disbursed" },
};

/** The chair or owner decides an allowance request, and records disbursement once paid by the Bursar. */
export async function POST(req: Request, { params }: Ctx) {
  if (badOrigin(req)) return fail(403, "Request blocked");
  const me = await requireStaffApi({ decide: true });
  if (!me) return fail(403, "Only the committee chair or owner can decide allowance requests");
  const { id } = await params;
  const body = (await req.json().catch(() => null)) as { action?: string; note?: string } | null;
  const m = moves[String(body?.action ?? "")];
  if (!m) return fail(400, "Unknown action");
  const note = String(body?.note ?? "").trim().slice(0, 2000) || null;
  if (m.to === "declined" && !note) return fail(400, "Please give the scholar a reason");
  const q = await db();
  const { rows } = await q.query<{ slug: string; reference: string; status: string }>(
    "select r.slug, r.status, a.reference from allowance_requests r join applications a on a.id = r.application_id where r.id = $1",
    [id],
  ).catch(() => ({ rows: [] as { slug: string; reference: string; status: string }[] }));
  const r = rows[0];
  if (!r) return fail(404, "Not found");
  if (!m.from.includes(r.status)) return fail(409, `A request that is ${r.status} can't be changed that way`);
  await q.query(
    "update allowance_requests set status = $2, decision_note = coalesce($3, decision_note), decided_by = $4, decided_at = now(), updated_at = now() where id = $1",
    [id, m.to, note, me.id],
  );
  await audit(me.id, `allowance_${m.to}`, r.reference, `${r.slug}${note ? ` · ${note}` : ""}`);
  return NextResponse.json({ ok: true, status: m.to });
}
