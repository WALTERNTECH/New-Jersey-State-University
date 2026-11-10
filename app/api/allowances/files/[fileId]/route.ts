import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentApplicant, fail, unseal } from "@/lib/auth";

type Ctx = { params: Promise<{ fileId: string }> };

/** A scholar's own supporting document. */
export async function GET(_req: Request, { params }: Ctx) {
  const me = await currentApplicant();
  if (!me) return fail(401, "Please sign in to continue");
  const { fileId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(fileId)) return fail(404, "Not found");
  const q = await db();
  const { rows } = await q.query<{ filename: string; mime: string; content: Uint8Array }>(
    `select f.filename, f.mime, f.content from allowance_files f
     join allowance_requests r on r.id = f.request_id join applications a on a.id = r.application_id
     where f.id = $1 and a.applicant_id = $2`,
    [fileId, me.id],
  );
  if (!rows[0]) return fail(404, "Not found");
  return new NextResponse(new Uint8Array(unseal(Buffer.from(rows[0].content))), {
    headers: { "Content-Type": rows[0].mime, "Content-Disposition": `inline; filename="${rows[0].filename.replace(/"/g, "")}"`, "Cache-Control": "private, no-store" },
  });
}
