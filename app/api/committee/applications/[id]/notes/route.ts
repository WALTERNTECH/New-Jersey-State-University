import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { badOrigin, fail } from "@/lib/auth";
import { audit, requireStaffApi } from "@/lib/staff";

type Ctx = { params: Promise<{ id: string }> };

/** Internal committee notes. Applicants never see these. */
export async function POST(req: Request, { params }: Ctx) {
  if (badOrigin(req)) return fail(403, "Request blocked");
  const me = await requireStaffApi();
  if (!me) return fail(401, "Sign in again");
  const { id } = await params;
  const body = (await req.json().catch(() => null)) as { body?: string } | null;
  const text = String(body?.body ?? "").trim();
  if (!text) return fail(400, "Write a note first");
  if (text.length > 4000) return fail(400, "Keep notes under 4,000 characters");
  const q = await db();
  const app = await q.query<{ reference: string }>("select reference from applications where id = $1", [id]).catch(() => ({ rows: [] }));
  if (!app.rows[0]) return fail(404, "Not found");
  const { rows } = await q.query<{ id: number; created_at: string }>(
    "insert into notes (application_id, staff_id, body) values ($1, $2, $3) returning id, created_at",
    [id, me.id, text],
  );
  await audit(me.id, "note", app.rows[0].reference);
  return NextResponse.json({ note: { id: rows[0].id, body: text, created_at: rows[0].created_at, name: me.name } });
}
