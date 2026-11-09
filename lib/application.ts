import "server-only";
import { db } from "./db";
import { steps, stepErrors, documentKinds, type Data } from "./form";

export interface AppRow {
  id: string;
  reference: string;
  cycle: string;
  status: string;
  data: Data;
  submitted_at: string | null;
  updated_at: string;
  created_at: string;
  [k: string]: unknown;
}

export interface DocRow {
  id: string;
  kind: string;
  filename: string;
  mime: string;
  size: number;
  created_at: string;
  [k: string]: unknown;
}

export async function applicationFor(applicantId: string): Promise<AppRow | null> {
  const q = await db();
  const { rows } = await q.query<AppRow>(
    "select id, reference, cycle, status, data, submitted_at, updated_at, created_at from applications where applicant_id = $1",
    [applicantId],
  );
  return rows[0] ?? null;
}

export async function documentsFor(applicationId: string): Promise<DocRow[]> {
  const q = await db();
  const { rows } = await q.query<DocRow>(
    "select id, kind, filename, mime, size, created_at from documents where application_id = $1 order by created_at",
    [applicationId],
  );
  return rows;
}

export async function eventsFor(applicationId: string) {
  const q = await db();
  const { rows } = await q.query<{ status: string; note: string | null; created_at: string }>(
    "select status, note, created_at from status_events where application_id = $1 order by created_at",
    [applicationId],
  );
  return rows;
}

/** Which sections are complete, and what still blocks submission. */
export function progress(data: Data, docs: { kind: string }[]) {
  const sections = steps.map((s) => ({ id: s.id, title: s.title, done: Object.keys(stepErrors(s, data)).length === 0 }));
  const have = new Set(docs.map((d) => d.kind));
  const missingDocs = documentKinds.filter((k) => k.required && !have.has(k.kind)).map((k) => k.label);
  sections.push({ id: "documents", title: "Documents", done: missingDocs.length === 0 });
  const done = sections.filter((s) => s.done).length;
  return { sections, missingDocs, done, total: sections.length, ready: done === sections.length };
}
