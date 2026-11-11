import { NextResponse } from "next/server";
import { z } from "zod";
import { badOrigin, fail } from "@/lib/auth";
import { canDecide, requireStaffApi } from "@/lib/staff";
import { changeStatus } from "@/lib/stages";

const Body = z.object({
  ids: z.array(z.string().regex(/^[0-9a-f-]{36}$/i)).min(1).max(200),
  status: z.enum(["under_review", "interview", "awarded", "waitlisted", "not_selected"]),
  note: z.string().trim().max(2000).optional(),
});

/** Moves many applications at once. Each one is checked and emailed exactly as if moved on its own. */
export async function POST(req: Request) {
  if (badOrigin(req)) return fail(403, "Request blocked");
  const me = await requireStaffApi();
  if (!me) return fail(401, "Sign in again");
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(400, "Choose applications and a stage");
  const { ids, status, note } = parsed.data;
  if (status !== "under_review" && !canDecide(me)) return fail(403, "Only the committee chair or owner can make this change");
  let moved = 0;
  const skipped: string[] = [];
  for (const id of [...new Set(ids)]) {
    const r = await changeStatus(id, status, me.id, note || null);
    if (r.ok) moved++;
    else skipped.push(r.error);
  }
  return NextResponse.json({ ok: true, moved, skipped: skipped.length, reasons: [...new Set(skipped)].slice(0, 3) });
}
