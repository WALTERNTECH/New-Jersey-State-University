import { allowanceBySlug, levelOf } from "./content";

export interface AwardLine {
  title: string;
  amount: string;
  cadence: string;
}

/** The allowances that make up a scholar's award, following the choices made in the application. */
export function awardLines(data: Record<string, string>): AwardLine[] {
  const offCampus = String(data.housing ?? "").startsWith("Off-campus");
  const lines: AwardLine[] = [
    { title: "Full tuition and required fees", amount: "Full cost", cadence: `up to ${levelOf(data).semesters} semesters` },
    offCampus
      ? { title: allowanceBySlug("off-campus-housing")!.title, amount: "Up to $18,000", cadence: "per academic year, on submission of a lease" }
      : { title: "University residence hall and dining plan", amount: "Full cost", cadence: "each academic year" },
  ];
  for (const slug of ["books", "living", "health", "settling-in", "travel"]) {
    const a = allowanceBySlug(slug)!;
    lines.push({ title: a.title, amount: a.amount, cadence: a.cadence });
  }
  if (data.laptop === "Yes") lines.push({ title: allowanceBySlug("laptop")!.title, amount: "$2,500", cadence: "one-time grant at matriculation" });
  if (data.visa_needed === "Yes") lines.push({ title: allowanceBySlug("visa")!.title, amount: "Up to $800", cadence: "reimbursed on official receipts" });
  return lines;
}
