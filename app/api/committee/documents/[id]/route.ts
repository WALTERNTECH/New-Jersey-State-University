import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { badOrigin, fail, unseal } from "@/lib/auth";
import { audit, requireStaffApi } from "@/lib/staff";
import { docLabel, enrolKindSet } from "@/lib/form";
import { sendEmail } from "@/lib/email";
import { maybeClear } from "@/lib/stages";

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

/**
 * The chair or owner verifies or rejects an identification document. A rejection emails the scholar the
 * reason; the last verification clears them to report automatically.
 */
export async function POST(req: Request, { params }: Ctx) {
  if (badOrigin(req)) return fail(403, "Request blocked");
  const me = await requireStaffApi({ decide: true });
  if (!me) return fail(403, "Only the committee chair or owner can verify documents");
  const { id } = await params;
  if (!uuid.test(id)) return fail(404, "Not found");
  const body = (await req.json().catch(() => null)) as { action?: string; note?: string } | null;
  const action = body?.action;
  if (action !== "verify" && action !== "reject") return fail(400, "Unknown action");
  const note = String(body?.note ?? "").trim().slice(0, 500) || null;
  if (action === "reject" && !note) return fail(400, "Tell the scholar what is wrong with the document");

  const q = await db();
  const { rows } = await q.query<{ kind: string; review: string; application_id: string; reference: string; status: string; data: Record<string, string>; email: string; applicant_id: string; first_name: string }>(
    `select d.kind, d.review, d.application_id, a.reference, a.status, a.data, p.email, p.id as applicant_id, p.first_name
     from documents d join applications a on a.id = d.application_id join applicants p on p.id = a.applicant_id where d.id = $1`,
    [id],
  );
  const d = rows[0];
  if (!d) return fail(404, "Not found");
  if (!enrolKindSet.has(d.kind)) return fail(409, "Only identification documents are verified here");
  if (d.review !== "pending") return fail(409, "This document has already been reviewed");
  if (d.status !== "accepted") return fail(409, "Documents are verified while the scholar is preparing to report");

  const review = action === "verify" ? "verified" : "rejected";
  await q.query("update documents set review = $2, review_note = $3, reviewed_by = $4, reviewed_at = now() where id = $1 and review = 'pending'", [id, review, note, me.id]);
  await audit(me.id, `document_${review}`, d.reference, `${docLabel(d.kind)}${note ? ` · ${note}` : ""}`);
  const name = (d.data.preferred_name || d.data.first_name || d.first_name).trim();
  let cleared = false;
  if (review === "rejected") {
    await sendEmail({ kind: "document_rejected", to: d.email, applicantId: d.applicant_id, params: { name, reference: d.reference, document: docLabel(d.kind).toLowerCase(), note: note! } });
  } else {
    cleared = await maybeClear(d.application_id);
  }
  return NextResponse.json({ ok: true, review, cleared });
}
