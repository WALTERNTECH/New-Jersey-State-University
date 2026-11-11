import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { badOrigin, currentApplicant, fail } from "@/lib/auth";
import { revokeLetter } from "@/lib/letter";
import { sendEmail } from "@/lib/email";

/** The admitted candidate's reply to the offer of admission. Only possible while the offer stands. */
export async function POST(req: Request) {
  if (badOrigin(req)) return fail(403, "Request blocked");
  const me = await currentApplicant();
  if (!me) return fail(401, "Please sign in to continue");
  const body = (await req.json().catch(() => null)) as { decision?: string; confirm?: boolean } | null;
  const decision = body?.decision;
  if (decision !== "accept" && decision !== "decline") return fail(400, "Choose whether to accept or decline the offer");
  if (!body?.confirm) return fail(400, "Please confirm your decision");
  const to = decision === "accept" ? "accepted" : "declined_offer";
  const q = await db();
  const done = await q.tx(async (t) => {
    const { rows } = await t.query<{ id: string; reference: string; data: Record<string, string> }>(
      "update applications set status = $2, offer_reply_at = now(), updated_at = now() where applicant_id = $1 and status = 'awarded' returning id, reference, data",
      [me.id, to],
    );
    if (!rows[0]) return null;
    await t.query("insert into status_events (application_id, status, note) values ($1, $2, $3)", [
      rows[0].id,
      to,
      decision === "accept" ? "Offer of admission accepted" : "Offer of admission declined",
    ]);
    if (to === "declined_offer") await revokeLetter(rows[0].id, t);
    return rows[0];
  });
  if (!done) return fail(409, "There is no open offer of admission on this account");
  const name = (done.data.preferred_name || done.data.first_name || me.first_name).trim();
  await sendEmail({ kind: to === "accepted" ? "offer_accepted" : "offer_declined", to: me.email, applicantId: me.id, params: { name, reference: done.reference } });
  return NextResponse.json({ ok: true, status: to });
}
