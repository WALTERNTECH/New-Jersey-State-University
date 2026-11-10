import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

// RFC 6238 time-based codes (30-second steps, 6 digits, SHA-1), as used by authenticator apps.
const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += B32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}

export const newSecret = () => randomBytes(20);

function code(secret: Buffer, step: number): string {
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(step));
  const h = createHmac("sha1", secret).update(msg).digest();
  const o = h[h.length - 1] & 15;
  const n = ((h[o] & 0x7f) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3];
  return String(n % 1_000_000).padStart(6, "0");
}

/** Returns the matched time step (to block reuse), or null. Accepts one step of clock drift either way. */
export function verifyTotp(secret: Buffer, input: string, lastStep: number, now = Date.now()): number | null {
  const clean = input.replace(/\s/g, "");
  if (!/^\d{6}$/.test(clean)) return null;
  const current = Math.floor(now / 30_000);
  for (const step of [current, current - 1, current + 1]) {
    if (step <= lastStep) continue;
    if (timingSafeEqual(Buffer.from(code(secret, step)), Buffer.from(clean))) return step;
  }
  return null;
}

export const otpauthUri = (secret: Buffer, email: string) =>
  `otpauth://totp/${encodeURIComponent(`NJSU Committee:${email}`)}?secret=${base32(secret)}&issuer=${encodeURIComponent("NJSU Committee")}&algorithm=SHA1&digits=6&period=30`;

/** For tests and local checks only. */
export const totpNow = (secret: Buffer, now = Date.now()) => code(secret, Math.floor(now / 30_000));
