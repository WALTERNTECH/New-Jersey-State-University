import "server-only";
import { db } from "./db";
import { allowanceBySlug, type Allowance } from "./content";
import { isEmail, type Data } from "./form";

export interface RequestRow {
  id: string;
  slug: string;
  status: string;
  data: Record<string, string>;
  decision_note: string | null;
  submitted_at: string | null;
  decided_at: string | null;
  created_at: string;
  updated_at: string;
  [k: string]: unknown;
}

/** Allowances a scholar may hold only once (unless an earlier request was declined). */
const ONCE = new Set(["settling-in", "visa", "off-campus-housing"]);

export const requestStatusLabels: Record<string, string> = {
  draft: "Not yet submitted",
  submitted: "Under review",
  approved: "Approved",
  declined: "Not approved",
  disbursed: "Disbursed",
};

/**
 * Whether this scholar may open a request for an allowance now, and if not, why.
 * Only admitted scholars who have accepted their offer reach any request form; enrolment-phase
 * allowances additionally require that the scholar has reported to campus.
 */
export function canRequest(a: Allowance, status: string, data: Data, existing: RequestRow[]): { ok: true } | { ok: false; reason: string } {
  if (a.phase === "automatic") return { ok: false, reason: "Included in every award; no request is needed." };
  if (a.phase === "application") return { ok: false, reason: "Requested in the scholarship application." };
  if (status === "awarded") return { ok: false, reason: "Available once you have accepted your offer of admission." };
  if (status !== "accepted" && status !== "enrolled") return { ok: false, reason: "Available to admitted scholars only." };
  if (a.phase === "enrolled" && status !== "enrolled") return { ok: false, reason: "Available once you have reported to campus and enrolled." };
  if (a.slug === "off-campus-housing" && !String(data.housing ?? "").startsWith("Off-campus")) {
    return { ok: false, reason: "Available to scholars who chose off-campus housing in their application." };
  }
  if (a.slug === "visa" && data.visa_needed !== "Yes") return { ok: false, reason: "Available to scholars who require a U.S. student visa." };
  if (ONCE.has(a.slug) && existing.some((r) => r.slug === a.slug && ["submitted", "approved", "disbursed"].includes(r.status))) {
    return { ok: false, reason: "You have already submitted this request." };
  }
  if (existing.some((r) => r.slug === a.slug && r.status === "submitted")) {
    return { ok: false, reason: "A request is already under review. You may submit another once it has been decided." };
  }
  return { ok: true };
}

export async function requestsFor(applicationId: string): Promise<RequestRow[]> {
  const q = await db();
  const { rows } = await q.query<RequestRow>(
    "select id, slug, status, data, decision_note, submitted_at, decided_at, created_at, updated_at from allowance_requests where application_id = $1 order by created_at desc",
    [applicationId],
  );
  return rows;
}

export function fieldErrors(a: Allowance, data: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of a.fields ?? []) {
    const v = String(data[f.name] ?? "").trim();
    if (!v) {
      if (f.required) out[f.name] = "This is required";
      continue;
    }
    if (v.length > 4000) out[f.name] = "Please shorten this answer";
    else if (f.type === "email" && !isEmail(v)) out[f.name] = "Enter a valid email address";
    else if (f.type === "number" && (!Number.isFinite(Number(v)) || Number(v) < 0)) out[f.name] = "Enter a number";
    else if (f.type === "number" && f.max !== undefined && Number(v) > f.max) out[f.name] = `The maximum is ${f.max.toLocaleString("en-US")}`;
    else if (f.type === "date" && Number.isNaN(Date.parse(v))) out[f.name] = "Enter a valid date";
    else if (f.type === "select" && f.options && !f.options.includes(v)) out[f.name] = "Choose an option";
  }
  return out;
}

export const cleanData = (a: Allowance, raw: Record<string, unknown>) => {
  const names = new Set((a.fields ?? []).map((f) => f.name));
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw ?? {})) if (names.has(k)) out[k] = String(v ?? "").slice(0, 4000);
  return out;
};

export { allowanceBySlug };
