import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { badOrigin, currentApplicant, fail } from "@/lib/auth";
import { applicationFor, documentsFor, progress } from "@/lib/application";
import { knownFields } from "@/lib/form";

export async function GET() {
  const me = await currentApplicant();
  if (!me) return fail(401, "Sign in to continue");
  const app = await applicationFor(me.id);
  if (!app) return fail(404, "No application found");
  const docs = await documentsFor(app.id);
  return NextResponse.json({ application: app, documents: docs, progress: progress(app.data, docs) });
}

/** Autosave: merges the fields sent into the draft. Unknown fields are ignored. */
export async function PATCH(req: Request) {
  if (badOrigin(req)) return fail(403, "Request blocked");
  const me = await currentApplicant();
  if (!me) return fail(401, "Your session has ended. Sign in again to keep saving.");
  const body = (await req.json().catch(() => null)) as { data?: Record<string, unknown> } | null;
  if (!body?.data || typeof body.data !== "object") return fail(400, "Nothing to save");
  const patch: Record<string, string> = {};
  for (const [k, v] of Object.entries(body.data)) {
    if (!knownFields.has(k)) continue;
    patch[k] = String(v ?? "").slice(0, 6000);
  }
  const q = await db();
  const { rows } = await q.query<{ updated_at: string }>(
    "update applications set data = data || $2::jsonb, updated_at = now() where applicant_id = $1 and status = 'draft' returning updated_at",
    [me.id, JSON.stringify(patch)],
  );
  if (!rows.length) return fail(409, "This application has been submitted and can no longer be edited.");
  return NextResponse.json({ ok: true, saved_at: rows[0].updated_at });
}
