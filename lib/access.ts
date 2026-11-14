import "server-only";
import { headers } from "next/headers";
import { db } from "./db";

// A record of security-relevant events with the IP address and browser they came from: account
// creation, sign-in, submission, password resets and changes to payment details. Used to protect
// accounts and investigate misuse, as described in the Privacy Policy. Kept for 12 months.

export type AccessEvent = "signup" | "signin" | "submitted" | "payment_changed" | "password_reset" | "password_changed" | "staff_signin";

export const accessLabels: Record<string, string> = {
  signup: "Account created",
  signin: "Signed in",
  submitted: "Application submitted",
  payment_changed: "Payment details changed",
  password_reset: "Password reset by email",
  password_changed: "Password changed",
  staff_signin: "Committee sign-in",
};

/** The caller's IP address and browser, as reported by the hosting platform. */
export async function clientInfo(): Promise<{ ip: string | null; userAgent: string | null }> {
  const h = await headers();
  const ip = (h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0] ?? "").trim().slice(0, 64) || null;
  return { ip, userAgent: h.get("user-agent")?.slice(0, 300) ?? null };
}

/** Never throws: a logging failure must not block the action being logged. */
export async function logAccess(event: AccessEvent, who: { applicantId?: string | null; staffId?: string | null }) {
  try {
    const { ip, userAgent } = await clientInfo();
    const q = await db();
    await q.query("insert into access_log (applicant_id, staff_id, event, ip, user_agent) values ($1, $2, $3, $4, $5)", [
      who.applicantId ?? null,
      who.staffId ?? null,
      event,
      ip,
      userAgent,
    ]);
    // Retention: now and then, clear records older than 12 months.
    if (Math.random() < 0.03) await q.query("delete from access_log where created_at < now() - interval '12 months'");
  } catch (e) {
    console.error("access log failed:", (e as Error).message);
  }
}
