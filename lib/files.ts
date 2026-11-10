export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

/** Identifies a PDF, JPEG or PNG by its first bytes, regardless of the file name a browser sends. */
export function sniffMime(b: Buffer): string | null {
  if (b.subarray(0, 4).toString("latin1") === "%PDF") return "application/pdf";
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  return null;
}

export const safeFilename = (name: string) => (name || "document").replace(/[^\w.\- ()]+/g, "_").slice(0, 120);
