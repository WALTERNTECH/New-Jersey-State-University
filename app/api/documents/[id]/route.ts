import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { badOrigin, currentApplicant, fail, unseal } from "@/lib/auth";
import { applicationFor } from "@/lib/application";

type Ctx = { params: Promise<{ id: string }> };
const uuid = /^[0-9a-f-]{36}$/i;

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const me = await currentApplicant();
  if (!me) return fail(401, "Sign in to continue");
  const app = await applicationFor(me.id);
  if (!app || !uuid.test(id)) return fail(404, "Not found");
  const q = await db();
  const { rows } = await q.query<{ filename: string; mime: string; content: Uint8Array }>(
    "select filename, mime, content from documents where id = $1 and application_id = $2",
    [id, app.id],
  );
  if (!rows[0]) return fail(404, "Not found");
  const body = unseal(Buffer.from(rows[0].content));
  return new NextResponse(new Uint8Array(body), {
    headers: {
      "Content-Type": rows[0].mime,
      "Content-Disposition": `inline; filename="${rows[0].filename.replace(/"/g, "")}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

export async function DELETE(req: Request, { params }: Ctx) {
  if (badOrigin(req)) return fail(403, "Request blocked");
  const { id } = await params;
  const me = await currentApplicant();
  if (!me) return fail(401, "Sign in to continue");
  const app = await applicationFor(me.id);
  if (!app || !uuid.test(id)) return fail(404, "Not found");
  if (app.status !== "draft") return fail(409, "Submitted documents can't be removed. Upload a newer file instead.");
  const q = await db();
  await q.query("delete from documents where id = $1 and application_id = $2", [id, app.id]);
  return NextResponse.json({ ok: true });
}
