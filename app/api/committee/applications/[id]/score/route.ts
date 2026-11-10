import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { badOrigin, fail } from "@/lib/auth";
import { audit, requireStaffApi } from "@/lib/staff";

type Ctx = { params: Promise<{ id: string }> };
const n = z.coerce.number().int().min(1).max(5);
const Body = z.object({ academic: n, need: n, essays: n, recommendation: n, comment: z.string().trim().max(2000).optional() });

/** Each committee member keeps one score per application and can revise it while the review is open. */
export async function POST(req: Request, { params }: Ctx) {
  if (badOrigin(req)) return fail(403, "Request blocked");
  const me = await requireStaffApi();
  if (!me) return fail(401, "Sign in again");
  const { id } = await params;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(400, "Give every criterion a score from 1 to 5");
  const b = parsed.data;
  const q = await db();
  const app = await q.query<{ reference: string; status: string }>("select reference, status from applications where id = $1", [id]).catch(() => ({ rows: [] }));
  if (!app.rows[0]) return fail(404, "Not found");
  if (!["under_review", "interview"].includes(app.rows[0].status)) return fail(409, "Scores can be given while an application is under review or at interview");
  await q.query(
    `insert into scores (application_id, staff_id, academic, need, essays, recommendation, comment) values ($1, $2, $3, $4, $5, $6, $7)
     on conflict (application_id, staff_id) do update set academic = excluded.academic, need = excluded.need, essays = excluded.essays,
       recommendation = excluded.recommendation, comment = excluded.comment, updated_at = now()`,
    [id, me.id, b.academic, b.need, b.essays, b.recommendation, b.comment || null],
  );
  const total = b.academic + b.need + b.essays + b.recommendation;
  await audit(me.id, "score", app.rows[0].reference, `${total}/20`);
  return NextResponse.json({ ok: true });
}
