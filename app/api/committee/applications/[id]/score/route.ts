import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { badOrigin, fail } from "@/lib/auth";
import { audit, requireStaffApi } from "@/lib/staff";
import { changeStatus } from "@/lib/stages";

type Ctx = { params: Promise<{ id: string }> };
const n = z.coerce.number().int().min(1).max(5);
const Body = z.object({ academic: n, need: n, essays: n, potential: n, comment: z.string().trim().max(2000).optional() });
const uuid = /^[0-9a-f-]{36}$/i;

/**
 * Each committee member keeps one score per application and can revise it while the review is open.
 * Scoring a new application opens its review automatically.
 */
export async function POST(req: Request, { params }: Ctx) {
  if (badOrigin(req)) return fail(403, "Request blocked");
  const me = await requireStaffApi();
  if (!me) return fail(401, "Sign in again");
  const { id } = await params;
  if (!uuid.test(id)) return fail(404, "Not found");
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(400, "Give every criterion a score from 1 to 5");
  const b = parsed.data;
  const q = await db();
  const app = await q.query<{ reference: string; status: string }>("select reference, status from applications where id = $1", [id]);
  if (!app.rows[0]) return fail(404, "Not found");
  const status = app.rows[0].status;
  if (!["submitted", "under_review", "interview"].includes(status)) return fail(409, "Scores can be given while an application is new, under review or at interview");
  await q.query(
    `insert into scores (application_id, staff_id, academic, need, essays, potential, comment) values ($1, $2, $3, $4, $5, $6, $7)
     on conflict (application_id, staff_id) do update set academic = excluded.academic, need = excluded.need, essays = excluded.essays,
       potential = excluded.potential, comment = excluded.comment, updated_at = now()`,
    [id, me.id, b.academic, b.need, b.essays, b.potential, b.comment || null],
  );
  const total = b.academic + b.need + b.essays + b.potential;
  await audit(me.id, "score", app.rows[0].reference, `${total}/20`);
  if (status === "submitted") await changeStatus(id, "under_review", me.id, "Review opened when first scored", { auto: true });
  return NextResponse.json({ ok: true });
}
