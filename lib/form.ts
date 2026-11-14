// The application, described once and used by the form, the review page and the server checks.
import { countries } from "./countries";
import { countryNames, eligibleCountries, levelLabels, levelOf, programmesByLevel, type LevelId } from "./content";

export type FieldType = "text" | "email" | "date" | "select" | "textarea" | "number" | "yesno" | "phone";

export interface Field {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
  autoComplete?: string;
  minWords?: number;
  maxWords?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  half?: boolean;
  /** Digits only, exactly this many (for example an Australian BSB). */
  digits?: number;
  pattern?: { re: RegExp; message: string };
  showIf?: (d: Data) => boolean;
}

export interface Step {
  id: string;
  title: string;
  short: string;
  fields: Field[];
  /** Stored encrypted and apart from the rest of the application, never in the general record. */
  secure?: boolean;
}

export type Data = Record<string, string>;

const yearNow = new Date().getFullYear();

// Some answers depend on the level of study. A name may appear more than once in a section,
// with exactly one version shown for any level.
const isLevel = (...ids: LevelId[]) => (d: Data) => ids.includes(levelOf(d).id);
const undergrad = isLevel("bachelors");
const postgrad = isLevel("masters", "doctoral");
const programmeField = (id: LevelId): Field => ({
  name: "major",
  label: "Intended programme of study",
  type: "select",
  options: programmesByLevel[id],
  required: true,
  half: true,
  showIf: isLevel(id),
});

export const steps: Step[] = [
  {
    id: "personal",
    title: "Student identity",
    short: "Identity",
    fields: [
      { name: "first_name", label: "First name", type: "text", required: true, autoComplete: "given-name", half: true, maxLength: 80 },
      { name: "last_name", label: "Last name", type: "text", required: true, autoComplete: "family-name", half: true, maxLength: 80 },
      { name: "middle_name", label: "Middle name", type: "text", autoComplete: "additional-name", half: true, maxLength: 80 },
      { name: "preferred_name", label: "Preferred name", type: "text", half: true, maxLength: 80 },
      { name: "date_of_birth", label: "Date of birth", type: "date", required: true, autoComplete: "bday", half: true },
      { name: "gender", label: "Gender", type: "select", options: ["Female", "Male", "Non-binary", "Prefer not to say"], half: true },
      { name: "citizenship", label: "Country of citizenship", type: "select", options: [...countryNames], required: true, half: true },
      { name: "residence", label: "Country of residence", type: "select", options: [...countryNames], required: true, half: true },
    ],
  },
  {
    id: "contact",
    title: "Contact information",
    short: "Contact",
    fields: [
      { name: "phone", label: "Mobile number", type: "phone", required: true, autoComplete: "tel-national" },
      { name: "whatsapp", label: "Is this number on WhatsApp?", type: "yesno" },
      { name: "address", label: "Street address", type: "text", required: true, autoComplete: "street-address", maxLength: 160 },
      { name: "city", label: "City or town", type: "text", required: true, autoComplete: "address-level2", half: true, maxLength: 80 },
      { name: "region", label: "State, county or region", type: "text", autoComplete: "address-level1", half: true, maxLength: 80 },
      { name: "postal_code", label: "Postal code", type: "text", autoComplete: "postal-code", half: true, maxLength: 20 },
    ],
  },
  {
    id: "academics",
    title: "Academic background",
    short: "Education",
    fields: [
      { name: "level", label: "Level of study", type: "select", options: levelLabels, required: true },
      {
        name: "education_level",
        label: "Highest level of education",
        type: "select",
        required: true,
        showIf: undergrad,
        options: [
          "Completed secondary / high school",
          "In final year of secondary / high school",
          "Some college or university, no degree",
          "Diploma or associate degree",
          "Vocational or technical certificate",
        ],
      },
      {
        name: "education_level",
        label: "Highest level of education",
        type: "select",
        required: true,
        showIf: postgrad,
        options: [
          "In final year of a bachelor’s degree",
          "Bachelor’s degree",
          "Bachelor’s degree with honours",
          "Postgraduate diploma or certificate",
          "In final year of a master’s degree",
          "Master’s degree",
          "Doctoral degree",
        ],
      },
      { name: "school_name", label: "Secondary school name", type: "text", required: true, maxLength: 160, half: true, showIf: undergrad },
      { name: "university", label: "University or college", type: "text", required: true, maxLength: 160, half: true, showIf: postgrad },
      { name: "degree_subject", label: "Degree and subject", type: "text", required: true, maxLength: 120, half: true, showIf: postgrad },
      { name: "school_country", label: "Country of school or university", type: "select", options: countries, required: true, half: true },
      { name: "graduation_year", label: "Year completed or expected", type: "number", required: true, min: 1970, max: yearNow + 1, half: true },
      { name: "grades", label: "Final grade, class or average", type: "text", required: true, half: true, maxLength: 60 },
      programmeField("bachelors"),
      programmeField("masters"),
      programmeField("doctoral"),
      {
        name: "english",
        label: "English",
        type: "select",
        required: true,
        half: true,
        options: ["First language", "My school taught in English", "I have an English test score", "I am still learning English"],
      },
      { name: "english_test", label: "English test and score", type: "text", maxLength: 60, showIf: (d) => d.english === "I have an English test score", required: true },
      { name: "research", label: "Proposed research topic", type: "textarea", required: true, minWords: 50, maxWords: 300, showIf: isLevel("doctoral") },
      { name: "supervisor", label: "Preferred supervisor", type: "text", maxLength: 120, showIf: isLevel("doctoral") },
    ],
  },
  {
    id: "household",
    title: "Household and finances",
    short: "Household",
    fields: [
      { name: "household_size", label: "People in your household, including you", type: "number", required: true, min: 1, max: 30, half: true },
      { name: "earners", label: "People in your household who earn an income", type: "number", required: true, min: 0, max: 30, half: true },
      {
        name: "income",
        label: "Yearly household income (US dollars)",
        type: "select",
        required: true,
        options: ["Under $2,000", "$2,000 – $5,000", "$5,000 – $10,000", "$10,000 – $20,000", "$20,000 – $40,000", "Over $40,000"],
      },
      { name: "first_generation", label: "Would you be the first in your family to attend university?", type: "yesno", required: true },
      { name: "orphan_or_care", label: "Have you lost a parent, or grown up in care?", type: "yesno", required: true },
      { name: "circumstances", label: "Other circumstances", type: "textarea", maxWords: 200 },
    ],
  },
  {
    id: "support",
    title: "Scholarship support",
    short: "Support",
    fields: [
      {
        name: "housing",
        label: "Housing preference",
        type: "select",
        required: true,
        options: ["University residence hall with dining plan", "Off-campus housing (Off-Campus Housing and Board Allowance)"],
      },
      { name: "laptop", label: "Do you require the Laptop and Technology Allowance?", type: "yesno", required: true },
      { name: "visa_needed", label: "Will you require a U.S. student (F-1) visa?", type: "yesno", required: true },
      { name: "accessibility", label: "Accessibility, medical or dietary needs", type: "textarea", maxWords: 150 },
    ],
  },
  {
    id: "essays",
    title: "Personal statements",
    short: "Statements",
    fields: [
      { name: "essay_goals", label: "What do you hope to study, and what will you do with your degree?", type: "textarea", required: true, minWords: 100, maxWords: 400 },
      { name: "essay_challenge", label: "Describe a challenge you have faced and what it taught you.", type: "textarea", required: true, minWords: 100, maxWords: 400 },
    ],
  },
  {
    id: "payment",
    title: "Payment details",
    short: "Payment",
    secure: true,
    fields: [
      { name: "bank_country", label: "Country of the bank", type: "select", options: [...countryNames], required: true, half: true },
      { name: "account_holder", label: "Account holder name", type: "text", required: true, half: true, maxLength: 120 },
      { name: "bank_name", label: "Bank name", type: "text", required: true, half: true, maxLength: 120 },
      { name: "branch", label: "Branch", type: "text", half: true, maxLength: 120 },
      { name: "bsb", label: "BSB", type: "text", required: true, half: true, digits: 6, showIf: (d) => d.bank_country === "Australia" },
      {
        name: "account_number",
        label: "Account number or IBAN",
        type: "text",
        required: true,
        half: true,
        maxLength: 34,
        pattern: { re: /^[A-Za-z0-9 ]{5,34}$/, message: "Enter the account number as shown by your bank" },
      },
      { name: "swift", label: "SWIFT / BIC code", type: "text", half: true, maxLength: 11, pattern: { re: /^[A-Za-z0-9]{8}([A-Za-z0-9]{3})?$/, message: "A SWIFT code has 8 or 11 letters and numbers" } },
    ],
  },
];

export const paymentStep = steps.find((s) => s.secure)!;
export const paymentFields = new Set(paymentStep.fields.map((f) => f.name));

/** Documents submitted with the application. Identification is requested only after an offer is accepted. */
export const documentKinds = [
  { kind: "transcript", label: "Academic transcript or certificate", required: true },
  { kind: "income", label: "Proof of household income", required: false },
  { kind: "english", label: "English test result or school letter", required: false },
] as const;

/** Identification and enrolment documents, requested from admitted scholars once they accept, and verified by the Office. */
export const enrolmentDocs = [
  { kind: "passport", label: "Passport biographical page", required: true },
  { kind: "photo", label: "Passport-style photograph", required: true },
  { kind: "immunisation", label: "Immunisation record", required: true },
  { kind: "certificate", label: "Final school or degree certificate", required: false },
] as const;

export type DocKind = (typeof documentKinds)[number]["kind"];
export const docKindSet = new Set<string>(documentKinds.map((d) => d.kind));
export const enrolKindSet = new Set<string>(enrolmentDocs.map((d) => d.kind));

const legacyDocLabels: Record<string, string> = { identity: "Identity document (submitted with the application)" };
export const docLabel = (kind: string) =>
  [...documentKinds, ...enrolmentDocs].find((d) => d.kind === kind)?.label ?? legacyDocLabels[kind] ?? kind;

export const reviewLabels: Record<string, string> = { pending: "Awaiting verification", verified: "Verified", rejected: "Needs replacing" };

export const allSteps = [
  ...steps.map((s) => ({ id: s.id, short: s.short, title: s.title })),
  { id: "documents", short: "Documents", title: "Documents" },
  { id: "review", short: "Sign and submit", title: "Review, sign and submit" },
];

export const wordCount = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0);

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const isEmail = (s: string) => emailRe.test(s);

// ---------- phone numbers: a country, then the national number after its code ----------

type Country = (typeof eligibleCountries)[number];
const byLongestDial = [...eligibleCountries].sort((a, b) => b.dial.length - a.dial.length);
export const countryByName = (name: string | undefined) => eligibleCountries.find((c) => c.name === name);

/** "+254 712345678" → Kenya and "712345678". */
export function splitPhone(v: string): { country: Country | null; national: string } {
  const s = (v ?? "").replace(/[^\d+]/g, "");
  const c = byLongestDial.find((x) => s.startsWith(x.dial));
  return c ? { country: c, national: s.slice(c.dial.length) } : { country: null, national: s.replace(/^\+/, "") };
}

/** Joins a country and what was typed, dropping a leading trunk zero ("0712…" → "712…"). */
export function joinPhone(country: Country | undefined, typed: string) {
  const digits = typed.replace(/\D/g, "").replace(/^0+/, "");
  return country ? `${country.dial} ${digits}` : digits;
}

export function phoneError(v: string): string | null {
  const { country, national } = splitPhone(v);
  if (!country) return "Choose the country for this number";
  if (!national) return "Enter the phone number";
  if (!(country.digits as readonly number[]).includes(national.length)) return `Enter the ${country.digits[0]} digits after ${country.dial}`;
  return null;
}

export function fieldError(f: Field, d: Data): string | null {
  if (f.showIf && !f.showIf(d)) return null;
  const v = (d[f.name] ?? "").trim();
  if (f.type === "phone") return v && splitPhone(v).national ? phoneError(v) : f.required ? "This is required" : null;
  if (!v) return f.required ? "This is required" : null;
  if (f.maxLength && v.length > f.maxLength) return `Keep this under ${f.maxLength} characters`;
  if (f.type === "email" && !emailRe.test(v)) return "Enter a valid email address";
  if (f.digits && !new RegExp(`^\\d{${f.digits}}$`).test(v.replace(/[\s-]/g, ""))) return `Enter ${f.digits} digits`;
  if (f.pattern && !f.pattern.re.test(v)) return f.pattern.message;
  if (f.type === "number") {
    const n = Number(v);
    if (!Number.isFinite(n)) return "Enter a number";
    if (f.min !== undefined && n < f.min) return `Must be at least ${f.min}`;
    if (f.max !== undefined && n > f.max) return `Must be ${f.max} or less`;
  }
  if (f.type === "date") {
    const t = Date.parse(v);
    if (Number.isNaN(t)) return "Enter a valid date";
    const age = (Date.now() - t) / (365.25 * 864e5);
    if (age < 14 || age > 80) return "Check the year of this date";
  }
  if (f.type === "select" && f.options && !f.options.includes(v)) return "Choose an option from the list";
  if (f.type === "yesno" && v !== "Yes" && v !== "No") return "Choose yes or no";
  if (f.type === "textarea") {
    const w = wordCount(v);
    if (f.minWords && w < f.minWords) return `At least ${f.minWords} words (${w} so far)`;
    if (f.maxWords && w > f.maxWords) return `Keep this to ${f.maxWords} words (${w} now)`;
  }
  return null;
}

export function stepErrors(step: Step, d: Data): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of step.fields) {
    const e = fieldError(f, d);
    if (e) out[f.name] = e;
  }
  return out;
}

/** The fields of a section that apply to these answers, one per name. */
export const visibleFields = (step: Step, d: Data) => step.fields.filter((f) => !f.showIf || f.showIf(d));

/** Every field of the general record once, for tables and exports. */
export const uniqueFields = (list: Step[]) => {
  const seen = new Set<string>();
  return list.flatMap((s) => s.fields).filter((f) => !seen.has(f.name) && seen.add(f.name));
};

/** A stored answer, or "" if it belongs to a version of the form these answers no longer use. */
export const answerFor = (step: Step, name: string, d: Data) => (visibleFields(step, d).some((f) => f.name === name) ? d[name] ?? "" : "");

/** Fields saved with the general application record. Payment details are never among them. */
export const knownFields = new Set(steps.filter((s) => !s.secure).flatMap((s) => s.fields.map((f) => f.name)));

/**
 * How much of the application is done: every required answer and required document counts
 * once, so the figure moves with each question rather than jumping a section at a time.
 */
export function completion(data: Data, payment: Data | null, docs: { kind: string }[]) {
  let total = 0;
  let done = 0;
  for (const s of steps) {
    const d = s.secure ? payment ?? {} : data;
    for (const f of s.fields) {
      if (!f.required || (f.showIf && !f.showIf(d))) continue;
      total++;
      if (!fieldError(f, d)) done++;
    }
  }
  for (const k of documentKinds) {
    if (!k.required) continue;
    total++;
    if (docs.some((x) => x.kind === k.kind)) done++;
  }
  return { done, total, percent: total ? Math.floor((done / total) * 100) : 0 };
}

/** Per section: complete, started or not started. */
export function sectionState(step: Step, d: Data): "complete" | "started" | "empty" {
  if (Object.keys(stepErrors(step, d)).length === 0) return "complete";
  return step.fields.some((f) => (d[f.name] ?? "").trim()) ? "started" : "empty";
}

export const statusLabels: Record<string, string> = {
  draft: "In progress",
  submitted: "Submitted",
  under_review: "Under review",
  interview: "Interview",
  awarded: "Admitted with scholarship",
  waitlisted: "Waitlisted",
  not_selected: "Not admitted",
  accepted: "Offer accepted",
  declined_offer: "Offer declined",
  enrolled: "Enrolled",
  // Not a stage of its own: recorded in the history when documents and arrival plan are complete.
  cleared: "Cleared to report",
};

/** Admitted scholars who have accepted their offer, and those who have reported to campus. */
export const ADMITTED = ["accepted", "enrolled"];
