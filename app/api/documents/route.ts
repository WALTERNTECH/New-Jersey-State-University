import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { badOrigin, currentApplicant, fail, seal } from "@/lib/auth";
import { applicationFor } from "@/lib/application";
import { docKindSet } from "@/lib/form";

const MAX_BYTES = 4 * 1024 * 1024;

function sniff(b: Buffer): string | null {
  if (b.subarray(0, 4).toString("latin1") === "%PDF") return "application/pdf";
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  return null;
}

/** One file per document kind; uploading again replaces it. Allowed while in progress and after submission. */
export async function POST(req: Request) {
  if (badOrigin(req)) return fail(403, "Request blocked");
  const me = await currentApplicant();
  if (!me) return fail(401, "Sign in to continue");
  const app = await applicationFor(me.id);
  if (!app) return fail(404, "No application found");
  if (!["draft", "submitted", "under_review"].includes(app.status)) return fail(409, "Documents can no longer be changed");

  const form = await req.formData().catch(() => null);
  const kind = String(form?.get("kind") ?? "");
  const file = form?.get("file");
  if (!docKindSet.has(kind)) return fail(400, "Unknown document type");
  if (!(file instanceof File)) return fail(400, "Choose a file to upload");
  if (file.size > MAX_BYTES) return fail(413, "That file is over 4 MB. Try a smaller scan or a photo.");
  const bytes = Buffer.from(await file.arrayBuffer());
  const mime = sniff(bytes);
  if (!mime) return fail(415, "Upload a PDF, JPG or PNG file");

  const filename = (file.name || "document").replace(/[^\w.\- ()]+/g, "_").slice(0, 120);
  const q = await db();
  const row = await q.tx(async (t) => {
    if (app.status === "draft") await t.query("delete from documents where application_id = $1 and kind = $2", [app.id, kind]);
    const r = await t.query<{ id: string; created_at: string }>(
      "insert into documents (application_id, kind, filename, mime, size, content) values ($1, $2, $3, $4, $5, $6) returning id, created_at",
      [app.id, kind, filename, mime, bytes.length, seal(bytes)],
    );
    await t.query("update applications set updated_at = now() where id = $1", [app.id]);
    return r.rows[0];
  });
  return NextResponse.json({ document: { id: row.id, kind, filename, mime, size: bytes.length, created_at: row.created_at } });
}
