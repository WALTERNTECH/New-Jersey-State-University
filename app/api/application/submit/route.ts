import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { badOrigin, currentApplicant, fail } from "@/lib/auth";
import { applicationFor, documentsFor, progress } from "@/lib/application";

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
  await q.tx(async (t) => {
    await t.query("update applications set status = 'submitted', submitted_at = now(), updated_at = now() where id = $1 and status = 'draft'", [app.id]);
    await t.query("insert into status_events (application_id, status, note) values ($1, 'submitted', 'Application received')", [app.id]);
  });
  return NextResponse.json({ ok: true, reference: app.reference });
}
