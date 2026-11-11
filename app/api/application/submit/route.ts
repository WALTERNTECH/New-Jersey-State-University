import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { badOrigin, currentApplicant, fail } from "@/lib/auth";
import { applicationFor, documentsFor, progress } from "@/lib/application";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  if (badOrigin(req)) return fail(403, "Request blocked");
  const me = await currentApplicant();
  if (!me) return fail(401, "Sign in to continue");
  const body = (await req.json().catch(() => null)) as { accurate?: boolean; consent?: boolean } | null;
  if (!body?.accurate || !body?.consent) return fail(400, "Please confirm both declarations");

  const app = await applicationFor(me.id);
  if (!app) return fail(404, "No application found");
  if (app.status !== "draft") return NextResponse.json({ ok: true, reference: app.reference });
  const p = progress(app.data, await documentsFor(app.id));
  if (!p.ready) {
    const missing = p.sections.filter((s) => !s.done).map((s) => s.title);
    return fail(400, `Finish these sections first: ${missing.join(", ")}`, { missing });
  }
  const q = await db();
  const moved = await q.tx(async (t) => {
    const r = await t.query("update applications set status = 'submitted', submitted_at = now(), updated_at = now() where id = $1 and status = 'draft' returning id", [app.id]);
    if (!r.rows[0]) return false;
    await t.query("insert into status_events (application_id, status, note) values ($1, 'submitted', 'Application received')", [app.id]);
    return true;
  });
  if (moved) {
    const name = (app.data.preferred_name || app.data.first_name || me.first_name).trim();
    await sendEmail({ kind: "submitted", to: me.email, applicantId: me.id, params: { name, reference: app.reference } });
  }
  return NextResponse.json({ ok: true, reference: app.reference });
}
