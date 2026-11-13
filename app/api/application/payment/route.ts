import { NextResponse } from "next/server";
import { badOrigin, currentApplicant, fail } from "@/lib/auth";
import { applicationFor } from "@/lib/application";
import { paymentFields, paymentStep, stepErrors, type Data } from "@/lib/form";
import { masked, paymentSummary, savePayment } from "@/lib/payment";
import { alertOffice, sendEmail } from "@/lib/email";

/**
 * Saves the applicant's bank details, sealed. While the application is in progress, each answer is
 * saved as it is typed. Afterwards, a change must be complete and valid, and both the scholar and
 * the Office are told about it, so a change nobody expected is noticed.
 */
export async function PUT(req: Request) {
  if (badOrigin(req)) return fail(403, "Request blocked");
  const me = await currentApplicant();
  if (!me) return fail(401, "Your session has ended. Sign in again to keep saving.");
  const app = await applicationFor(me.id);
  if (!app) return fail(404, "No application found");
  if (["not_selected", "declined_offer"].includes(app.status)) return fail(409, "Payment details can no longer be changed on this application");
  const body = (await req.json().catch(() => null)) as { data?: Record<string, unknown> } | null;
  if (!body?.data || typeof body.data !== "object") return fail(400, "Nothing to save");
  const patch: Data = {};
  for (const [k, v] of Object.entries(body.data)) if (paymentFields.has(k)) patch[k] = String(v ?? "").slice(0, 160);

  if (app.status === "draft") {
    await savePayment(app.id, patch, true);
    return NextResponse.json({ ok: true });
  }

  const errors = stepErrors(paymentStep, patch);
  if (Object.keys(errors).length) return fail(400, "Please complete each required field", { errors });
  await savePayment(app.id, patch, false);
  const account = masked(await paymentSummary(app.id));
  const name = (app.data.preferred_name || app.data.first_name || me.first_name).trim();
  await sendEmail({ kind: "payment_changed", to: me.email, applicantId: me.id, params: { name, reference: app.reference, account } });
  await alertOffice("office_payment", {
    name: [app.data.first_name, app.data.last_name].filter(Boolean).join(" ") || name,
    reference: app.reference,
    app_id: app.id,
    account,
  });
  return NextResponse.json({ ok: true, account });
}
