import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { badOrigin, currentApplicant, fail } from "@/lib/auth";
import { applicationFor } from "@/lib/application";
import { allowanceBySlug, canRequest, cleanData, requestsFor } from "@/lib/allowances";

/** Starts (or continues) a draft request for an allowance, saving the answers given so far. */
export async function POST(req: Request) {
  if (badOrigin(req)) return fail(403, "Request blocked");
  const me = await currentApplicant();
  if (!me) return fail(401, "Please sign in to continue");
  const body = (await req.json().catch(() => null)) as { slug?: string; data?: Record<string, unknown> } | null;
  const a = allowanceBySlug(String(body?.slug ?? ""));
  if (!a) return fail(404, "Unknown allowance");
  const app = await applicationFor(me.id);
  if (!app) return fail(404, "No application found");
  const existing = await requestsFor(app.id);
  const draft = existing.find((r) => r.slug === a.slug && r.status === "draft");
  const allowed = canRequest(a, app.status, app.data, existing.filter((r) => r.status !== "draft"));
  if (!allowed.ok) return fail(403, allowed.reason);
  const data = cleanData(a, body?.data ?? {});
  const q = await db();
  if (draft) {
    await q.query("update allowance_requests set data = $2, updated_at = now() where id = $1", [draft.id, JSON.stringify(data)]);
    return NextResponse.json({ id: draft.id });
  }
  const { rows } = await q.query<{ id: string }>(
    "insert into allowance_requests (application_id, slug, data) values ($1, $2, $3) returning id",
    [app.id, a.slug, JSON.stringify(data)],
  );
  return NextResponse.json({ id: rows[0].id });
}
