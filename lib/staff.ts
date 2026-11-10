import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createHash, randomBytes } from "node:crypto";
import { db, type Q } from "./db";

export const STAFF_COOKIE = "njsu_staff";
const SESSION_HOURS = 12;
const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export type Role = "owner" | "chair" | "reviewer";
export const roleLabels: Record<Role, string> = { owner: "Owner", chair: "Committee chair", reviewer: "Reviewer" };

export interface Staff {
  id: string;
  email: string;
  name: string;
  role: Role;
  must_change: boolean;
  mfa_enabled: boolean;
  mfa_ok: boolean;
  [k: string]: unknown;
}

/** Decisions are for the owner and the chair; reviewers read, score and comment. */
export const canDecide = (s: Pick<Staff, "role">) => s.role === "owner" || s.role === "chair";
export const isOwner = (s: Pick<Staff, "role">) => s.role === "owner";

export async function createStaffSession(staffId: string) {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_HOURS * 3600e3);
  const q = await db();
  await q.query("insert into staff_sessions (token_hash, staff_id, expires_at) values ($1, $2, $3)", [sha256(token), staffId, expires]);
  (await cookies()).set(STAFF_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    expires,
  });
}

async function tokenHash() {
  const t = (await cookies()).get(STAFF_COOKIE)?.value;
  return t ? sha256(t) : null;
}

/** The signed-in staff member, whether or not they have finished two-step sign-in. Cached per request. */
export const currentStaff = cache(async (): Promise<Staff | null> => {
  const h = await tokenHash();
  if (!h) return null;
  const q = await db();
  const { rows } = await q.query<Staff>(
    `select s.id, s.email, s.name, s.role, s.must_change, (s.totp_secret is not null) as mfa_enabled, ss.mfa_ok
     from staff_sessions ss join staff s on s.id = ss.staff_id
     where ss.token_hash = $1 and ss.expires_at > now() and not s.disabled`,
    [h],
  );
  return rows[0] ?? null;
});

export async function markMfa() {
  const h = await tokenHash();
  if (!h) return;
  const q = await db();
  await q.query("update staff_sessions set mfa_ok = true where token_hash = $1", [h]);
}

export async function endStaffSession() {
  const h = await tokenHash();
  if (h) await (await db()).query("delete from staff_sessions where token_hash = $1", [h]);
  (await cookies()).delete(STAFF_COOKIE);
}

/** For console pages: sends people to the right step of sign-in, or away if their role is too low. */
export async function requireStaffPage(opts: { owner?: boolean; allowMustChange?: boolean } = {}): Promise<Staff> {
  const s = await currentStaff();
  if (!s) redirect("/committee/signin");
  if (!s.mfa_ok) redirect(s.mfa_enabled ? "/committee/mfa" : "/committee/mfa?setup=1");
  if (s.must_change && !opts.allowMustChange) redirect("/committee/account?first=1");
  if (opts.owner && !isOwner(s)) redirect("/committee");
  const q = await db();
  q.query("update staff set last_seen = now() where id = $1", [s.id]).catch(() => {});
  return s;
}

/** For console API routes: null means the caller gets a 401/403. */
export async function requireStaffApi(opts: { owner?: boolean; decide?: boolean } = {}): Promise<Staff | null> {
  const s = await currentStaff();
  if (!s || !s.mfa_ok) return null;
  if (opts.owner && !isOwner(s)) return null;
  if (opts.decide && !canDecide(s)) return null;
  return s;
}

export async function audit(staffId: string | null, action: string, target?: string | null, detail?: string | null, q?: Q) {
  const conn = q ?? (await db());
  await conn.query("insert into audit (staff_id, action, target, detail) values ($1, $2, $3, $4)", [staffId, action, target ?? null, detail ?? null]);
}

export function setupToken(): string | null {
  if (process.env.ADMIN_SETUP_TOKEN) return process.env.ADMIN_SETUP_TOKEN;
  return process.env.DATABASE_URL ? null : "local-setup";
}

export const tempPassword = () => {
  const words = randomBytes(9).toString("base64url").replace(/[-_]/g, "x");
  return `${words.slice(0, 4)}-${words.slice(4, 8)}-${words.slice(8, 12)}`;
};
