import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fail, unseal } from "@/lib/auth";
import { audit, requireStaffApi } from "@/lib/staff";

type Ctx = { params: Promise<{ id: string }> };
const uuid = /^[0-9a-f-]{36}$/i;

/** Opens an applicant's document for the committee. Every view is written to the activity log. */
export async function GET(_req: Request, { params }: Ctx) {
  const me = await requireStaffApi();
  if (!me) return fail(401, "Sign in again");
  const { id } = await params;
  if (!uuid.test(id)) return fail(404, "Not found");
  const q = await db();
  const { rows } = await q.query<{ filename: string; mime: string; content: Uint8Array; kind: string; reference: string }>(
    "select d.filename, d.mime, d.content, d.kind, a.reference from documents d join applications a on a.id = d.application_id where d.id = $1",
    [id],
  );
  if (!rows[0]) return fail(404, "Not found");
  await audit(me.id, "view_document", rows[0].reference, rows[0].kind);
  return new NextResponse(new Uint8Array(unseal(Buffer.from(rows[0].content))), {
    headers: {
      "Content-Type": rows[0].mime,
      "Content-Disposition": `inline; filename="${rows[0].filename.replace(/"/g, "")}"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
