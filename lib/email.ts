import "server-only";
import { after } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { db } from "./db";
import { renderEmail, type EmailKind, type Params } from "./email-templates";
import { siteUrl } from "./site";
import { letterPdf } from "./letter";

/** Email goes out through Resend once both settings exist; until then every message is recorded as not sent. */
export const emailConfigured = () => !!(process.env.RESEND_API_KEY?.trim() && process.env.EMAIL_FROM?.trim());

interface Send {
  kind: EmailKind;
  to: string;
  applicantId?: string | null;
  params: Params;
  /** Values used for this one delivery and never stored, such as a password reset link. */
  secret?: Params;
}

function later(fn: () => Promise<unknown>) {
  try {
    after(fn);
  } catch {
    void fn().catch(() => {});
  }
}

/** Records an email in the log and delivers it after the response has gone. Never throws. */
export async function sendEmail(s: Send): Promise<string | null> {
  try {
    const q = await db();
    const { subject } = renderEmail(s.kind, { ...s.params, ...(s.secret ?? {}) }, siteUrl());
    const { rows } = await q.query<{ id: string }>(
      "insert into emails (applicant_id, to_email, kind, subject, params) values ($1, $2, $3, $4, $5) returning id",
      [s.applicantId ?? null, s.to, s.kind, subject, JSON.stringify(s.params)],
    );
    const id = rows[0].id;
    later(() => deliver(id, s.secret));
    return id;
  } catch (e) {
    console.error("email could not be queued:", (e as Error).message);
    return null;
  }
}

/** The Office's own inbox for alerts: OFFICE_EMAIL, or failing that the reply-to address. */
export const officeEmail = () => process.env.OFFICE_EMAIL?.trim() || process.env.EMAIL_REPLY_TO?.trim() || "";

/** Tells the Office about something that happened, in its own inbox. Does nothing if no office address is set. */
export async function alertOffice(kind: EmailKind, params: Params) {
  const to = officeEmail();
  if (!to) return null;
  return sendEmail({ kind, to, applicantId: null, params });
}

/** Sends a logged email again, for example once Resend has been connected. */
export async function resend(id: string) {
  const q = await db();
  const { rows } = await q.query<{ id: string }>(
    "update emails set status = 'queued', error = null where id = $1 and status <> 'sent' and kind <> 'password_reset' returning id",
    [id],
  );
  if (rows[0]) later(() => deliver(id));
  return !!rows[0];
}

async function deliver(id: string, secret?: Params) {
  const q = await db();
  const { rows } = await q.query<{ to_email: string; kind: string; params: Params; status: string; attempts: number }>(
    "select to_email, kind, params, status, attempts from emails where id = $1",
    [id],
  );
  const row = rows[0];
  if (!row || row.status === "sent") return;
  const params = { ...row.params, ...(secret ?? {}) };
  const { subject, html, text } = renderEmail(row.kind, params, siteUrl());
  const attempts = row.attempts + 1;

  let attachments: { filename: string; content: string }[] | undefined;
  if (row.kind === "awarded" && params.application_id) {
    const pdf = await letterPdf(params.application_id).catch((e) => (console.error("letter failed:", e), null));
    if (pdf) attachments = [{ filename: pdf.filename, content: Buffer.from(pdf.bytes).toString("base64") }];
  }

  // Locally, keep a copy of every message so it can be read in a browser.
  if (process.env.NODE_ENV !== "production") {
    const dir = path.join(process.cwd(), ".local", "outbox");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, `${row.kind}-${id}.html`), html);
    if (attachments) await writeFile(path.join(dir, `${row.kind}-${id}.pdf`), Buffer.from(attachments[0].content, "base64"));
  }

  if (!emailConfigured()) {
    await q.query("update emails set status = 'skipped', error = $2, attempts = $3 where id = $1", [id, "Email is not set up yet", attempts]);
    return;
  }

  try {
    // RESEND_API_BASE exists only so tests can point at a local stand-in.
    const res = await fetch(`${process.env.RESEND_API_BASE?.trim() || "https://api.resend.com"}/emails`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY!.trim()}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `${id}-${attempts}`,
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM!.trim(),
        to: [row.to_email],
        subject,
        html,
        text,
        ...(process.env.EMAIL_REPLY_TO?.trim() ? { reply_to: process.env.EMAIL_REPLY_TO.trim() } : {}),
        ...(attachments ? { attachments } : {}),
        tags: [{ name: "kind", value: row.kind }],
      }),
      signal: AbortSignal.timeout(15_000),
    });
    const body = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!res.ok) throw new Error(body.message || `Resend returned ${res.status}`);
    await q.query("update emails set status = 'sent', provider_id = $2, error = null, attempts = $3, sent_at = now() where id = $1", [id, body.id ?? null, attempts]);
  } catch (e) {
    await q.query("update emails set status = 'failed', error = $2, attempts = $3 where id = $1", [id, String((e as Error).message).slice(0, 500), attempts]);
  }
}
