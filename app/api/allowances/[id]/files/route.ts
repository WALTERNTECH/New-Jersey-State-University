import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { badOrigin, currentApplicant, fail, seal } from "@/lib/auth";
import { allowanceBySlug } from "@/lib/allowances";
import { MAX_UPLOAD_BYTES, safeFilename, sniffMime } from "@/lib/files";

type Ctx = { params: Promise<{ id: string }> };

/** Attaches a supporting document to a draft request. Uploading the same document again replaces it. */
export async function POST(req: Request, { params }: Ctx) {
  if (badOrigin(req)) return fail(403, "Request blocked");
  const me = await currentApplicant();
  if (!me) return fail(401, "Please sign in to continue");
  const { id } = await params;
  const q = await db();
  const { rows } = await q.query<{ slug: string; status: string }>(
    "select r.slug, r.status from allowance_requests r join applications a on a.id = r.application_id where r.id = $1 and a.applicant_id = $2",
    [id, me.id],
  ).catch(() => ({ rows: [] as { slug: string; status: string }[] }));
  const r = rows[0];
  if (!r) return fail(404, "Request not found");
  if (r.status !== "draft") return fail(409, "This request has already been submitted");
  const form = await req.formData().catch(() => null);
  const key = String(form?.get("key") ?? "");
  const file = form?.get("file");
  const doc = allowanceBySlug(r.slug)?.documents?.find((d) => d.key === key);
  if (!doc) return fail(400, "Unknown document");
  if (!(file instanceof File)) return fail(400, "Choose a file to upload");
  if (file.size > MAX_UPLOAD_BYTES) return fail(413, "Files must be 4 MB or smaller");
  const bytes = Buffer.from(await file.arrayBuffer());
  const mime = sniffMime(bytes);
  if (!mime) return fail(415, "Please upload a PDF, JPG or PNG file");
  await q.tx(async (t) => {
    await t.query("delete from allowance_files where request_id = $1 and doc_key = $2", [id, key]);
    await t.query("insert into allowance_files (request_id, doc_key, filename, mime, size, content) values ($1, $2, $3, $4, $5, $6)", [
      id,
      key,
      safeFilename(file.name),
      mime,
      bytes.length,
      seal(bytes),
    ]);
  });
  return NextResponse.json({ ok: true });
}
