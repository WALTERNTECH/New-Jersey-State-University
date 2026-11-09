import "server-only";
import { cookies } from "next/headers";
import { createHash, randomBytes, createCipheriv, createDecipheriv } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "./db";

export const SESSION_COOKIE = "njsu_session";
const SESSION_DAYS = 30;

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export interface Applicant {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}

export async function createSession(applicantId: string) {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 864e5);
  const q = await db();
  await q.query("insert into sessions (token_hash, applicant_id, expires_at) values ($1, $2, $3)", [sha256(token), applicantId, expires]);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });
}

export async function currentApplicant(): Promise<Applicant | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const q = await db();
  const { rows } = await q.query<Applicant & Record<string, unknown>>(
    `select a.id, a.email, a.first_name, a.last_name from sessions s join applicants a on a.id = s.applicant_id
     where s.token_hash = $1 and s.expires_at > now()`,
    [sha256(token)],
  );
  return rows[0] ?? null;
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    const q = await db();
    await q.query("delete from sessions where token_hash = $1", [sha256(token)]);
  }
  jar.delete(SESSION_COOKIE);
}

/** Mutating API calls must come from our own pages: a custom header plus a same-origin check. */
export function badOrigin(req: Request): boolean {
  if (req.headers.get("x-njsu") !== "1") return true;
  const origin = req.headers.get("origin");
  if (!origin) return false;
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    return new URL(origin).host !== host;
  } catch {
    return true;
  }
}

export const fail = (status: number, error: string, extra: Record<string, unknown> = {}) => NextResponse.json({ error, ...extra }, { status });

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function newReference(cycle: string) {
  const b = randomBytes(6);
  let s = "";
  for (const x of b) s += ALPHABET[x % ALPHABET.length];
  return `NJSU-${cycle.slice(-2)}-${s}`;
}

// Uploaded documents are sealed with AES-256-GCM before they reach the database.
function key(): Buffer {
  const k = process.env.MASTER_KEY;
  if (k) return Buffer.from(k, "base64");
  if (process.env.DATABASE_URL) throw new Error("MASTER_KEY is not set");
  return createHash("sha256").update("njsu-local-development-only").digest();
}

export function seal(plain: Buffer): Buffer {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key(), iv);
  const body = Buffer.concat([c.update(plain), c.final()]);
  return Buffer.concat([Buffer.from([1]), iv, c.getAuthTag(), body]);
}

export function unseal(box: Buffer): Buffer {
  const iv = box.subarray(1, 13);
  const tag = box.subarray(13, 29);
  const d = createDecipheriv("aes-256-gcm", key(), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(box.subarray(29)), d.final()]);
}
