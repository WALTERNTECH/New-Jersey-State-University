import "server-only";
import { randomBytes } from "node:crypto";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { db, type Q } from "./db";
import { programme } from "./content";
import { awardLines } from "./award";
import { siteUrl } from "./site";
import { CREST_PNG_BASE64 } from "./crest-data";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
// 32 symbols divide 256 evenly, so every symbol is equally likely.
const newCode = () => {
  let s = "";
  for (const x of randomBytes(8)) s += ALPHABET[x % 32];
  return `${s.slice(0, 4)}-${s.slice(4)}`;
};

/** Statuses for which a letter of admission stands. */
export const LETTER_STATUSES = ["awarded", "accepted", "enrolled"];

/** Issues (or re-issues, with a fresh code) the letter of admission when a candidate is admitted. */
export async function issueLetter(applicationId: string, q: Q) {
  await q.query(
    `insert into letters (application_id, code) values ($1, $2)
     on conflict (application_id) do update set code = excluded.code, issued_at = now(), revoked_at = null`,
    [applicationId, newCode()],
  );
}

/** Withdraws a letter, for example when a decision is revised or the offer is declined. */
export async function revokeLetter(applicationId: string, q: Q) {
  await q.query("update letters set revoked_at = now() where application_id = $1 and revoked_at is null", [applicationId]);
}

export interface LetterInfo {
  code: string;
  issued_at: string;
  revoked_at: string | null;
  reference: string;
  status: string;
  data: Record<string, string>;
  [k: string]: unknown;
}

export async function letterFor(applicationId: string): Promise<LetterInfo | null> {
  const q = await db();
  const { rows } = await q.query<LetterInfo>(
    "select l.code, l.issued_at, l.revoked_at, a.reference, a.status, a.data from letters l join applications a on a.id = l.application_id where l.application_id = $1",
    [applicationId],
  );
  return rows[0] ?? null;
}

/** A letter is current while it has not been withdrawn and the candidate is still admitted. */
export const letterIsCurrent = (l: Pick<LetterInfo, "revoked_at" | "status"> | null) => !!l && !l.revoked_at && LETTER_STATUSES.includes(l.status);

export const letterFilename = (reference: string) => `NJSU-Letter-of-Admission-${reference}.pdf`;

// ---------- PDF ----------

const NAVY = rgb(6 / 255, 36 / 255, 60 / 255);
const GOLD = rgb(234 / 255, 187 / 255, 19 / 255);
const INK = rgb(0.11, 0.14, 0.19);
const GREY = rgb(0.42, 0.46, 0.52);
const RULE = rgb(0.88, 0.9, 0.93);
const W = 612;
const H = 792;
const L = 72;
const R = W - 72;
const BOTTOM = 92;

const longDate = (d: string | Date) => new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "America/New_York" });

/** Standard PDF fonts only cover Western European characters; anything else is simplified rather than failing. */
function cleaner(font: PDFFont) {
  const ok = new Set(font.getCharacterSet());
  return (s: string) =>
    [...String(s ?? "")]
      .map((ch) => {
        if (ok.has(ch.codePointAt(0)!)) return ch;
        const base = ch.normalize("NFKD").replace(/[̀-ͯ]/g, "");
        return base && [...base].every((c) => ok.has(c.codePointAt(0)!)) ? base : "?";
      })
      .join("");
}

function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const out: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const next = line ? `${line} ${word}` : word;
    if (line && font.widthOfTextAtSize(next, size) > width) {
      out.push(line);
      line = word;
    } else line = next;
  }
  if (line) out.push(line);
  return out;
}

export async function renderLetterPdf(l: LetterInfo): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`Letter of Admission ${l.reference}`);
  doc.setAuthor(programme.university);
  doc.setSubject(`${programme.name}, ${programme.cycle}`);
  doc.setCreator(programme.office);

  const serif = await doc.embedFont(StandardFonts.TimesRoman);
  const serifBold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const serifItalic = await doc.embedFont(StandardFonts.TimesRomanItalic);
  const sans = await doc.embedFont(StandardFonts.Helvetica);
  const sansBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const crest = await doc.embedPng(Buffer.from(CREST_PNG_BASE64, "base64"));
  const clean = cleaner(serif);

  let page: PDFPage = doc.addPage([W, H]);
  let y = H - 56;
  const ensure = (h: number) => {
    if (y - h < BOTTOM) {
      page = doc.addPage([W, H]);
      y = H - 72;
    }
  };
  const text = (s: string, x: number, size: number, font: PDFFont, color = INK) => page.drawText(clean(s), { x, y, size, font, color });
  const para = (s: string, opts: { size?: number; font?: PDFFont; leading?: number; indent?: number; color?: typeof INK; after?: number } = {}) => {
    const size = opts.size ?? 11;
    const font = opts.font ?? serif;
    const leading = opts.leading ?? 15.5;
    const x = L + (opts.indent ?? 0);
    for (const line of wrap(clean(s), font, size, R - x)) {
      ensure(leading);
      page.drawText(line, { x, y, size, font, color: opts.color ?? INK });
      y -= leading;
    }
    y -= opts.after ?? 8;
  };

  // Letterhead
  const cw = 50;
  const ch = (crest.height / crest.width) * cw;
  page.drawImage(crest, { x: (W - cw) / 2, y: y - ch, width: cw, height: ch });
  y -= ch + 20;
  const title = programme.university.toUpperCase();
  page.drawText(title, { x: (W - serifBold.widthOfTextAtSize(title, 17)) / 2, y, size: 17, font: serifBold, color: NAVY });
  y -= 15;
  const office = programme.office.toUpperCase();
  page.drawText(office, { x: (W - sans.widthOfTextAtSize(office, 7.5)) / 2, y, size: 7.5, font: sans, color: GREY });
  y -= 14;
  page.drawLine({ start: { x: L, y }, end: { x: R, y }, thickness: 1.4, color: GOLD });
  y -= 30;

  // Date and reference
  const dateStr = longDate(l.issued_at);
  text(`Reference: ${l.reference}`, L, 9.5, sans, GREY);
  page.drawText(dateStr, { x: R - sans.widthOfTextAtSize(dateStr, 9.5), y, size: 9.5, font: sans, color: GREY });
  y -= 30;

  // Addressee
  const d = l.data;
  const name = [d.first_name, d.middle_name, d.last_name].filter(Boolean).join(" ");
  const address = [d.address, [d.city, d.region, d.postal_code].filter(Boolean).join(", "), d.residence].filter(Boolean);
  for (const line of [name, ...address]) {
    text(line, L, 11, line === name ? serifBold : serif);
    y -= 14.5;
  }
  y -= 16;

  text(`Dear ${(d.first_name || name).trim()},`, L, 11, serif);
  y -= 26;
  text("Offer of Admission and Award of the NJSU Access Scholarship", L, 12.5, serifBold, NAVY);
  y -= 24;

  const major = d.major && d.major !== "Undecided" ? `to study ${d.major}` : "with an undeclared major";
  para(
    `On behalf of the Scholarship Committee, I am delighted to offer you admission to ${programme.university} as a first-year undergraduate student ${major}, beginning in ${programme.startTerm} as a member of the ${programme.cycle}. You have also been selected as a recipient of the ${programme.name}.`,
  );
  para(
    "The Committee was impressed by your academic achievement, by the circumstances in which it was attained, and by the sense of purpose expressed in your personal statements. Your award is renewable for up to eight semesters while you remain enrolled full-time and in good academic standing, and comprises the following:",
    { after: 10 },
  );

  // Award table
  ensure(20);
  page.drawLine({ start: { x: L, y: y + 6 }, end: { x: R, y: y + 6 }, thickness: 0.8, color: NAVY });
  y -= 8;
  for (const a of awardLines(d)) {
    ensure(30);
    page.drawText(clean(a.title), { x: L + 2, y, size: 9.8, font: sansBold, color: INK });
    page.drawText(clean(a.amount), { x: R - 2 - sansBold.widthOfTextAtSize(clean(a.amount), 9.8), y, size: 9.8, font: sansBold, color: NAVY });
    y -= 12;
    page.drawText(clean(a.cadence), { x: L + 2, y, size: 8.3, font: sans, color: GREY });
    y -= 9;
    page.drawLine({ start: { x: L, y }, end: { x: R, y }, thickness: 0.5, color: RULE });
    y -= 13;
  }
  y -= 8;

  para("This offer is subject to the following conditions:", { after: 6 });
  const conditions = [
    `You reply to this offer through the applicant portal by ${programme.replyBy}.`,
    "Once you accept, you submit your identification documents and your arrival plan through the portal, for verification by the Office.",
    `You report to campus in person for registration in ${programme.arrival}, bringing your passport, this letter and your original academic certificates.`,
    "The information provided in your application is accurate and complete.",
  ];
  conditions.forEach((c, i) => {
    ensure(16);
    text(`${i + 1}.`, L + 10, 11, serif);
    para(c, { indent: 28, after: 3 });
  });
  y -= 6;
  para("No fee is payable to the University at any stage of admission or enrolment. This letter is not a visa or immigration document.", { font: serifItalic });
  para(`We congratulate you on this achievement and look forward to welcoming you to ${programme.university}.`, { after: 18 });

  ensure(80);
  text("Yours sincerely,", L, 11, serif);
  y -= 40;
  text("The Scholarship Committee", L, 11, serifBold, NAVY);
  y -= 14.5;
  text(programme.office, L, 10.5, serif, GREY);
  y -= 14;
  text(programme.university, L, 10.5, serif, GREY);

  // Verification footer on every page
  const pages = doc.getPages();
  const verify = `Verify this letter at ${siteUrl().replace(/^https?:\/\//, "")}/verify using reference ${l.reference} and code ${l.code}.`;
  pages.forEach((p, i) => {
    p.drawLine({ start: { x: L, y: 62 }, end: { x: R, y: 62 }, thickness: 0.5, color: RULE });
    p.drawText(verify, { x: L, y: 48, size: 7.8, font: sans, color: GREY });
    if (pages.length > 1) {
      const n = `Page ${i + 1} of ${pages.length}`;
      p.drawText(n, { x: R - sans.widthOfTextAtSize(n, 7.8), y: 36, size: 7.8, font: sans, color: GREY });
    }
  });

  return doc.save();
}

/** The current letter as a PDF, or null if there is no standing letter. */
export async function letterPdf(applicationId: string): Promise<{ bytes: Uint8Array; filename: string } | null> {
  const l = await letterFor(applicationId);
  if (!letterIsCurrent(l)) return null;
  return { bytes: await renderLetterPdf(l!), filename: letterFilename(l!.reference) };
}
