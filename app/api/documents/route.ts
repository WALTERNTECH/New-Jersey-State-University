import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { badOrigin, currentApplicant, fail, seal } from "@/lib/auth";
import { applicationFor } from "@/lib/application";
import { docKindSet, enrolKindSet } from "@/lib/form";
import { MAX_UPLOAD_BYTES, safeFilename, sniffMime } from "@/lib/files";

/**
 * Application documents: one file per kind, replaceable while in progress and added to after submission.
 * Identification documents: only after the offer is accepted; a pending file is replaced, a verified one is final.
 */
export async function POST(req: Request) {
  if (badOrigin(req)) return fail(403, "Request blocked");
  const me = await currentApplicant();
  if (!me) return fail(401, "Sign in to continue");
  const app = await applicationFor(me.id);
  if (!app) return fail(404, "No application found");

  const form = await req.formData().catch(() => null);
  const kind = String(form?.get("kind") ?? "");
  const file = form?.get("file");
  const enrol = enrolKindSet.has(kind);
  if (!docKindSet.has(kind) && !enrol) return fail(400, "Unknown document type");
  if (enrol && app.status !== "accepted") return fail(409, "Identification documents are requested once you have accepted your offer of admission");
  if (!enrol && !["draft", "submitted", "under_review"].includes(app.status)) return fail(409, "Documents can no longer be changed");
  if (!(file instanceof File)) return fail(400, "Choose a file to upload");
  if (file.size > MAX_UPLOAD_BYTES) return fail(413, "That file is over 4 MB. Try a smaller scan or a photo.");
  const bytes = Buffer.from(await file.arrayBuffer());
  const mime = sniffMime(bytes);
  if (!mime) return fail(415, "Upload a PDF, JPG or PNG file");

  const filename = safeFilename(file.name || "document");
  const q = await db();
  const row = await q.tx(async (t) => {
    if (enrol) {
      const v = await t.query("select 1 from documents where application_id = $1 and kind = $2 and review = 'verified'", [app.id, kind]);
      if (v.rows.length) return null;
      await t.query("delete from documents where application_id = $1 and kind = $2 and review = 'pending'", [app.id, kind]);
    } else if (app.status === "draft") {
      await t.query("delete from documents where application_id = $1 and kind = $2", [app.id, kind]);
    }
    const r = await t.query<{ id: string; created_at: string }>(
      "insert into documents (application_id, kind, filename, mime, size, content) values ($1, $2, $3, $4, $5, $6) returning id, created_at",
      [app.id, kind, filename, mime, bytes.length, seal(bytes)],
    );
    await t.query("update applications set updated_at = now() where id = $1", [app.id]);
    return r.rows[0];
  });
  if (!row) return fail(409, "This document has already been verified by the Office");
  return NextResponse.json({ document: { id: row.id, kind, filename, mime, size: bytes.length, created_at: row.created_at, review: "pending", review_note: null } });
}
