import "server-only";
import { db } from "./db";
import { seal, unseal } from "./auth";
import { paymentFields, type Data } from "./form";

// Bank details are sealed with the same key as uploaded documents. Only the bank, its country and
// the last four digits of the account are stored in the clear, so screens can show "Bank ···· 1234".

export interface PaymentSummary {
  bank_name: string | null;
  country: string | null;
  last4: string | null;
  updated_at: string;
  [k: string]: unknown;
}

const clean = (d: Data): Data => {
  const out: Data = {};
  for (const [k, v] of Object.entries(d ?? {})) if (paymentFields.has(k)) out[k] = String(v ?? "").slice(0, 160);
  if (out.bank_country !== "Australia") delete out.bsb;
  if (out.swift) out.swift = out.swift.toUpperCase();
  if (out.account_number) out.account_number = out.account_number.toUpperCase();
  return out;
};

export const last4 = (account: string | undefined) => (account ?? "").replace(/\s/g, "").slice(-4);
export const masked = (s: Pick<PaymentSummary, "bank_name" | "last4"> | null) => (s?.last4 ? `${s.bank_name ?? "Bank"} ···· ${s.last4}` : "");

export async function paymentFor(applicationId: string): Promise<Data | null> {
  const q = await db();
  const { rows } = await q.query<{ sealed: Uint8Array }>("select sealed from payment_details where application_id = $1", [applicationId]);
  if (!rows[0]) return null;
  return JSON.parse(unseal(Buffer.from(rows[0].sealed)).toString("utf8")) as Data;
}

export async function paymentSummary(applicationId: string): Promise<PaymentSummary | null> {
  const q = await db();
  const { rows } = await q.query<PaymentSummary>("select bank_name, country, last4, updated_at from payment_details where application_id = $1", [applicationId]);
  return rows[0] ?? null;
}

/** Saves bank details. With `merge`, unsent fields keep their earlier values (autosave while drafting). */
export async function savePayment(applicationId: string, patch: Data, merge: boolean): Promise<Data> {
  const prev = merge ? (await paymentFor(applicationId)) ?? {} : {};
  const next = clean({ ...prev, ...patch });
  const q = await db();
  await q.query(
    `insert into payment_details (application_id, sealed, bank_name, country, last4, updated_at) values ($1, $2, $3, $4, $5, now())
     on conflict (application_id) do update set sealed = excluded.sealed, bank_name = excluded.bank_name, country = excluded.country, last4 = excluded.last4, updated_at = now()`,
    [applicationId, seal(Buffer.from(JSON.stringify(next))), next.bank_name || null, next.bank_country || null, last4(next.account_number) || null],
  );
  return next;
}
