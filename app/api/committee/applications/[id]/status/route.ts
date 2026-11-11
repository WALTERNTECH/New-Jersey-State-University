import { NextResponse } from "next/server";
import { badOrigin, fail } from "@/lib/auth";
import { canDecide, requireStaffApi } from "@/lib/staff";
import { changeStatus } from "@/lib/stages";

type Ctx = { params: Promise<{ id: string }> };
const uuid = /^[0-9a-f-]{36}$/i;

/** Moves an application to its next stage. Letters, emails and the log follow automatically. */
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
  const r = await changeStatus(id, to, me.id, note);
  if (!r.ok) return fail(r.code, r.error);
  return NextResponse.json({ ok: true, status: to });
}
