// The application, described once and used by the form, the review page and the server checks.
import { countries } from "./countries";
import { programmes } from "./content";

export type FieldType = "text" | "email" | "tel" | "date" | "select" | "textarea" | "number" | "yesno";

export interface Field {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
  hint?: string;
  placeholder?: string;
  autoComplete?: string;
  minWords?: number;
  maxWords?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  half?: boolean;
  showIf?: (d: Data) => boolean;
}

export interface Step {
  id: string;
  title: string;
  short: string;
  intro: string;
  fields: Field[];
}

export type Data = Record<string, string>;

const yearNow = new Date().getFullYear();

export const steps: Step[] = [
  {
    id: "personal",
    title: "About you",
    short: "About you",
    intro: "Your name as it appears on your identity document, so we can match your records.",
    fields: [
      { name: "first_name", label: "First name", type: "text", required: true, autoComplete: "given-name", half: true, maxLength: 80 },
      { name: "last_name", label: "Last name", type: "text", required: true, autoComplete: "family-name", half: true, maxLength: 80 },
      { name: "middle_name", label: "Middle name", type: "text", autoComplete: "additional-name", half: true, maxLength: 80 },
      { name: "preferred_name", label: "Preferred name", type: "text", half: true, maxLength: 80, hint: "If different from your first name." },
      { name: "date_of_birth", label: "Date of birth", type: "date", required: true, autoComplete: "bday", half: true },
      { name: "gender", label: "Gender", type: "select", options: ["Female", "Male", "Non-binary", "Prefer not to say"], half: true },
      { name: "citizenship", label: "Country of citizenship", type: "select", options: countries, required: true, half: true },
      { name: "residence", label: "Country where you live", type: "select", options: countries, required: true, half: true },
    ],
  },
  {
    id: "contact",
    title: "Contact details",
    short: "Contact",
    intro: "We use these to reach you about interviews and your decision.",
    fields: [
      { name: "phone", label: "Mobile number", type: "tel", required: true, autoComplete: "tel", hint: "Include your country code, for example +254 712 345 678.", half: true, maxLength: 24 },
      { name: "whatsapp", label: "Can we reach you on WhatsApp at this number?", type: "yesno", half: true },
      { name: "address", label: "Street address", type: "text", required: true, autoComplete: "street-address", maxLength: 160 },
      { name: "city", label: "City or town", type: "text", required: true, autoComplete: "address-level2", half: true, maxLength: 80 },
      { name: "region", label: "State, county or region", type: "text", autoComplete: "address-level1", half: true, maxLength: 80 },
      { name: "postal_code", label: "Postal code", type: "text", autoComplete: "postal-code", half: true, maxLength: 20 },
    ],
  },
  {
    id: "academics",
    title: "Education",
    short: "Education",
    intro: "Tell us where you studied and what you would like to study at NJSU.",
    fields: [
      {
        name: "education_level",
        label: "Highest level of education",
        type: "select",
        required: true,
        options: [
          "Completed secondary / high school",
          "In final year of secondary / high school",
          "Some college or university, no degree",
          "Diploma or associate degree",
          "Vocational or technical certificate",
        ],
      },
      { name: "school_name", label: "Secondary / high school name", type: "text", required: true, maxLength: 160, half: true },
      { name: "school_country", label: "Country of school", type: "select", options: countries, required: true, half: true },
      { name: "graduation_year", label: "Year completed (or expected)", type: "number", required: true, min: 1970, max: yearNow + 1, half: true },
      { name: "grades", label: "Final grade or average", type: "text", required: true, half: true, maxLength: 60, placeholder: "e.g. KCSE B+, GPA 3.6, WAEC 6 credits" },
      { name: "major", label: "Programme you would like to study", type: "select", options: programmes, required: true, half: true },
      {
        name: "english",
        label: "Your English",
        type: "select",
        required: true,
        half: true,
        options: ["First language", "My school taught in English", "I have an English test score", "I am still learning English"],
      },
      {
        name: "english_test",
        label: "Test and score",
        type: "text",
        maxLength: 60,
        placeholder: "e.g. IELTS 6.5, Duolingo 115",
        showIf: (d) => d.english === "I have an English test score",
        required: true,
      },
    ],
  },
  {
    id: "household",
    title: "Household and finances",
    short: "Household",
    intro: "This helps us understand your need. Estimates are fine; we never ask for bank statements or payments.",
    fields: [
      { name: "household_size", label: "People in your household", type: "number", required: true, min: 1, max: 30, half: true, hint: "Including you." },
      { name: "earners", label: "How many of them earn an income", type: "number", required: true, min: 0, max: 30, half: true },
      {
        name: "income",
        label: "Yearly household income (US dollars, estimate)",
        type: "select",
        required: true,
        options: ["Under $2,000", "$2,000 – $5,000", "$5,000 – $10,000", "$10,000 – $20,000", "$20,000 – $40,000", "Over $40,000"],
      },
      { name: "first_generation", label: "Would you be the first in your family to attend university?", type: "yesno", required: true },
      { name: "orphan_or_care", label: "Have you lost a parent, or grown up in care?", type: "yesno", required: true },
      { name: "circumstances", label: "Anything else about your situation we should know", type: "textarea", maxWords: 200, hint: "Optional. Up to 200 words." },
    ],
  },
  {
    id: "essays",
    title: "Your story",
    short: "Your story",
    intro: "Two short pieces in your own words. There are no right answers; we want to hear your voice.",
    fields: [
      { name: "essay_goals", label: "What do you hope to study, and what will you do with your degree?", type: "textarea", required: true, minWords: 100, maxWords: 400 },
      { name: "essay_challenge", label: "Tell us about a challenge you have faced and what it taught you.", type: "textarea", required: true, minWords: 100, maxWords: 400 },
    ],
  },
  {
    id: "recommender",
    title: "Recommendation",
    short: "Recommender",
    intro: "Someone who knows you well: a teacher, principal, employer or community leader. We contact them after you submit, so you do not need to collect a letter.",
    fields: [
      { name: "rec_name", label: "Their full name", type: "text", required: true, half: true, maxLength: 120 },
      { name: "rec_email", label: "Their email", type: "email", required: true, half: true, maxLength: 160 },
      { name: "rec_role", label: "Their position", type: "text", required: true, half: true, maxLength: 120, placeholder: "e.g. Mathematics teacher" },
      {
        name: "rec_relationship",
        label: "How they know you",
        type: "select",
        required: true,
        half: true,
        options: ["Teacher", "Principal or head teacher", "Employer or supervisor", "Community or faith leader", "Coach or mentor", "Other"],
      },
    ],
  },
];

export const documentKinds = [
  { kind: "identity", label: "Identity document", hint: "Passport, national ID card or birth certificate.", required: true },
  { kind: "transcript", label: "Academic transcript or certificate", hint: "Your most recent results slip, transcript or school leaving certificate.", required: true },
  { kind: "income", label: "Proof of household income", hint: "A letter from a local official, a payslip or a benefits letter. Can follow within 14 days.", required: false },
  { kind: "english", label: "English evidence", hint: "A test score report, or a school letter confirming English instruction.", required: false },
] as const;

export type DocKind = (typeof documentKinds)[number]["kind"];
export const docKindSet = new Set<string>(documentKinds.map((d) => d.kind));

export const allSteps = [...steps.map((s) => ({ id: s.id, short: s.short })), { id: "documents", short: "Documents" }, { id: "review", short: "Review" }];

export const wordCount = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0);

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const isEmail = (s: string) => emailRe.test(s);

export function fieldError(f: Field, d: Data): string | null {
  if (f.showIf && !f.showIf(d)) return null;
  const v = (d[f.name] ?? "").trim();
  if (!v) return f.required ? "This is required" : null;
  if (f.maxLength && v.length > f.maxLength) return `Keep this under ${f.maxLength} characters`;
  if (f.type === "email" && !emailRe.test(v)) return "Enter a valid email address";
  if (f.type === "tel" && v.replace(/\D/g, "").length < 7) return "Enter a full phone number";
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

export const knownFields = new Set(steps.flatMap((s) => s.fields.map((f) => f.name)));

export const statusLabels: Record<string, string> = {
  draft: "In progress",
  submitted: "Submitted",
  under_review: "Under review",
  interview: "Interview",
  awarded: "Scholarship awarded",
  waitlisted: "Waitlisted",
  not_selected: "Not selected",
};
