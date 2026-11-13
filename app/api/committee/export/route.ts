import { db } from "@/lib/db";
import { fail } from "@/lib/auth";
import { audit, requireStaffApi } from "@/lib/staff";
import { steps, statusLabels } from "@/lib/form";

const cell = (v: unknown) => {
  let s = v === null || v === undefined ? "" : String(v);
  // Stop spreadsheet apps from treating a value as a formula.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** All submitted applications (no drafts, no documents) as CSV, for the owner and chair. */
export async function GET() {
  const me = await requireStaffApi({ decide: true });
  if (!me) return fail(403, "Only the committee chair or owner can export");
  const q = await db();
  const { rows } = await q.query<{ reference: string; status: string; submitted_at: string; email: string; data: Record<string, string>; avg: number | null; n: number }>(
    `select a.reference, a.status, a.submitted_at, p.email, a.data,
       (select round(avg(academic + need + essays + potential)::numeric, 1) from scores s where s.application_id = a.id) as avg,
       (select count(*)::int from scores s where s.application_id = a.id) as n
     from applications a join applicants p on p.id = a.applicant_id
     where a.status <> 'draft' order by a.submitted_at`,
  );
  // Bank details never leave the console in an export.
  const fields = steps.filter((s) => !s.secure).flatMap((s) => s.fields).filter((f) => !f.name.startsWith("essay_"));
  const header = ["Reference", "Status", "Submitted", "Email", ...fields.map((f) => f.label), "Average score /20", "Scores"];
  const lines = [header.map(cell).join(",")];
  for (const r of rows) {
    lines.push(
      [r.reference, statusLabels[r.status] ?? r.status, new Date(r.submitted_at).toISOString(), r.email, ...fields.map((f) => r.data[f.name] ?? ""), r.avg ?? "", r.n]
        .map(cell)
        .join(","),
    );
  }
  await audit(me.id, "export", null, `${rows.length} applications`);
  const date = new Date().toISOString().slice(0, 10);
  return new Response("﻿" + lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="njsu-applications-${date}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
