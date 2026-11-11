import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { badOrigin, currentApplicant, fail } from "@/lib/auth";
import { applicationFor } from "@/lib/application";
import { allowanceBySlug, canRequest, fieldErrors, requestsFor } from "@/lib/allowances";
import { alertOffice } from "@/lib/email";

type Ctx = { params: Promise<{ id: string }> };

/** Submits a draft request once every required answer and document is present. */
export async function POST(req: Request, { params }: Ctx) {
  if (badOrigin(req)) return fail(403, "Request blocked");
  const me = await currentApplicant();
  if (!me) return fail(401, "Please sign in to continue");
  const { id } = await params;
  const app = await applicationFor(me.id);
  if (!app) return fail(404, "No application found");
  const all = await requestsFor(app.id);
  const r = all.find((x) => x.id === id);
  if (!r) return fail(404, "Request not found");
  if (r.status !== "draft") return NextResponse.json({ ok: true });
  const a = allowanceBySlug(r.slug)!;
  const allowed = canRequest(a, app.status, app.data, all.filter((x) => x.status !== "draft"));
  if (!allowed.ok) return fail(403, allowed.reason);
  const errs = fieldErrors(a, r.data);
  if (Object.keys(errs).length) return fail(400, "Please complete each required field", { errors: errs });
  const q = await db();
  const files = await q.query<{ doc_key: string }>("select doc_key from allowance_files where request_id = $1", [id]);
  const have = new Set(files.rows.map((f) => f.doc_key));
  const missing = (a.documents ?? []).filter((d) => d.required && !have.has(d.key)).map((d) => d.label);
  if (missing.length) return fail(400, `Please attach: ${missing.join(", ")}`);
  const moved = await q.query("update allowance_requests set status = 'submitted', submitted_at = now(), updated_at = now() where id = $1 and status = 'draft' returning id", [id]);
  if (moved.rows[0])
    await alertOffice("office_allowance", {
      name: [app.data.first_name, app.data.last_name].filter(Boolean).join(" ") || me.first_name,
      reference: app.reference,
      allowance: a.title,
      request_id: id,
    });
  return NextResponse.json({ ok: true });
}
