// Every programme fact shown on the site lives here, so the Office of Admissions and Financial Aid
// can change dates, award terms and contact details in one place.

export const programme = {
  university: "New Jersey State University",
  short: "NJSU",
  name: "NJSU Access Scholarship",
  office: "Office of Admissions and Financial Aid",
  cycle: "2027–28 academic year",
  cycleCode: "2027",
  startTerm: "Fall 2027",
  opens: "9 November 2026",
  deadline: "15 March 2027",
  // Sydney is on daylight time (AEDT, UTC+11) until 4 April 2027.
  deadlineISO: "2027-03-15T23:59:59+11:00",
  deadlineTime: "11:59 p.m. Sydney time (AEDT)",
  timeZone: "Australia/Sydney",
  interviews: "April 2027",
  decisions: "15 May 2027",
  replyBy: "1 June 2027",
  arrival: "late August 2027",
  // Shown in the footer and on help prompts only when set.
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "",
  contactPhone: process.env.NEXT_PUBLIC_CONTACT_PHONE ?? "",
};

/** The degrees the scholarship supports. `label` is the value stored in the application. */
export const levels = [
  {
    id: "bachelors",
    label: "Bachelor’s degree",
    short: "Bachelor’s",
    duration: "Four years",
    semesters: 8,
    entry: "Completion of secondary school, or expected completion before the start of the academic year, and no previously conferred bachelor’s degree.",
  },
  {
    id: "masters",
    label: "Master’s degree",
    short: "Master’s",
    duration: "Two years",
    semesters: 4,
    entry: "A completed bachelor’s degree, or expected completion before the start of the academic year.",
  },
  {
    id: "doctoral",
    label: "Doctoral degree (Ph.D. / Doctorate)",
    short: "Doctoral",
    duration: "Up to five years",
    semesters: 10,
    entry: "A completed master’s degree or bachelor’s degree with honours, or expected completion before the start of the academic year.",
  },
] as const;
export type LevelId = (typeof levels)[number]["id"];
export const levelLabels = levels.map((l) => l.label);
export const levelById = (id: string | undefined) => levels.find((l) => l.id === id);
/** Applications started before levels existed are bachelor’s applications. */
export const levelOf = (d: Record<string, string | undefined>) => levels.find((l) => l.label === d.level) ?? levels[0];

export const pillars = [
  {
    title: "Full tuition and required fees",
    body: "The Access Scholarship meets the full cost of tuition and all mandatory university fees for the standard length of the degree: eight semesters for a bachelor’s degree, four for a master’s degree and up to ten for a doctoral degree.",
  },
  {
    title: "Housing and dining",
    body: "Scholars receive a place in university residence halls and a comprehensive dining plan, or an equivalent allowance for approved off-campus housing.",
  },
  {
    title: "Living and academic allowances",
    body: "A structured set of allowances covers course materials, technology, personal expenses, travel and health insurance throughout the degree.",
  },
  {
    title: "Advising and mentorship",
    body: "Each scholar is supported by a dedicated scholarship advisor and a faculty mentor or doctoral supervisor from orientation through commencement.",
  },
];

/** The scholarship is open to citizens and residents of these countries only. Dial codes drive the phone fields. */
export const eligibleCountries = [
  { name: "Australia", dial: "+61", digits: [9] },
  { name: "Egypt", dial: "+20", digits: [10] },
  { name: "Kenya", dial: "+254", digits: [9] },
  { name: "Nigeria", dial: "+234", digits: [10] },
  { name: "Singapore", dial: "+65", digits: [8] },
  { name: "Uganda", dial: "+256", digits: [9] },
] as const;
export const countryNames = eligibleCountries.map((c) => c.name);
export const countryList = "Australia, Singapore, Kenya, Nigeria, Egypt and Uganda";

export const eligibility = [
  `Citizenship or residence in ${countryList}.`,
  "The entry qualification for the chosen level of study, shown under Levels of study.",
  "Demonstrated financial need: the applicant’s family is unable to meet the cost of a university education.",
  "A minimum age of 16 years at matriculation.",
  "The ability to pursue coursework in English, or willingness to complete a preparatory English programme.",
];

export const timeline = [
  { when: programme.opens, title: "Application opens", body: "Accounts and applications open." },
  { when: programme.deadline, title: "Application deadline", body: `Applications close at ${programme.deadlineTime}.` },
  { when: programme.interviews, title: "Interviews", body: "Shortlisted candidates are interviewed by the Scholarship Committee." },
  { when: programme.decisions, title: "Admission decisions", body: "Decisions are released in the applicant portal and by email." },
  { when: programme.startTerm, title: "Matriculation", body: `Admitted scholars report to campus in ${programme.arrival}.` },
];

export const faqs = [
  {
    q: "Which degrees does the scholarship support?",
    a: "Bachelor’s, master’s and doctoral (Ph.D.) study. Applicants choose their level of study when they check their eligibility, and the application asks for the qualifications that level requires.",
  },
  {
    q: "What does the Access Scholarship cover?",
    a: "The award meets full tuition and required fees, housing and dining, and a series of allowances for course materials, technology, personal expenses, travel and health insurance for the standard length of the degree. Details of each allowance are published on the Financial Aid page.",
  },
  {
    q: "Is the scholarship renewable?",
    a: "The award is renewed each academic year for the standard length of the degree (up to eight semesters for a bachelor’s degree, four for a master’s degree and ten for a doctoral degree), provided the scholar remains enrolled full-time and in good academic standing.",
  },
  {
    q: "Which countries are eligible?",
    a: `The Access Scholarship is open to citizens and residents of ${countryList}. Scholars receive additional support for travel and immigration costs.`,
  },
  {
    q: "Which documents are required?",
    a: "Only the most recent academic transcript or examination certificate. Evidence of household income and English proficiency strengthen an application and may be submitted up to 14 days after the deadline. Identification documents are requested only from admitted scholars, after they accept their offer.",
  },
  {
    q: "How are candidates evaluated?",
    a: "The Scholarship Committee reviews each application holistically, considering academic preparation, financial circumstances and the personal qualities expressed in the essays.",
  },
  {
    q: "Must the application be completed in one sitting?",
    a: "No. The application saves automatically. Candidates may sign in from any device to continue where they left off.",
  },
  {
    q: "How will I hear about my application?",
    a: "Every stage is shown in the applicant portal and confirmed by email. Admitted candidates receive their letter of admission by email and can download it from the portal at any time.",
  },
  {
    q: "How are allowances paid?",
    a: "Approved allowances are paid by bank transfer to the account given in the Payment details section of the application. The University never asks for a PIN, a password or a card number, and never charges applicants.",
  },
];

/** Programmes open to scholars, by level of study. */
export const programmesByLevel: Record<LevelId, string[]> = {
  bachelors: ["Business Administration", "Computer Science", "Nursing", "Education", "Health Science", "Engineering Technology", "Psychology", "Undecided"],
  masters: [
    "Master of Business Administration (MBA)",
    "M.S. in Computer Science",
    "M.S. in Nursing",
    "M.Ed. in Education",
    "Master of Public Health (MPH)",
    "M.S. in Engineering",
    "M.A. in Psychology",
  ],
  doctoral: [
    "Doctor of Business Administration (DBA)",
    "Ph.D. in Computer Science",
    "Ph.D. in Nursing",
    "Ed.D. in Education",
    "Ph.D. in Public Health",
    "Ph.D. in Engineering",
    "Ph.D. in Psychology",
  ],
};
export const programmes = Object.values(programmesByLevel).flat();

/* ---------------- Allowances ---------------- */

/**
 * How a scholar receives each allowance:
 * - automatic: part of every award, disbursed without a request
 * - application: requested in the scholarship application itself
 * - admitted: requested in the portal once the offer of admission has been accepted
 * - enrolled: requested in the portal once the scholar has reported to campus
 */
export type AllowancePhase = "automatic" | "application" | "admitted" | "enrolled";

export interface AllowanceField {
  name: string;
  label: string;
  type: "text" | "email" | "date" | "number" | "select" | "textarea";
  options?: string[];
  hint?: string;
  required?: boolean;
  max?: number;
}

export interface Allowance {
  slug: string;
  category: string;
  title: string;
  amount: string;
  cadence: string;
  coverage: string;
  phase: AllowancePhase;
  who?: string;
  fields?: AllowanceField[];
  documents?: { key: string; label: string; hint?: string; required: boolean }[];
}

export const allowanceCategories = [
  { id: "academic", title: "Academic and technology", intro: "Resources for coursework, laboratories and study." },
  { id: "living", title: "Housing, dining and living", intro: "Support for day-to-day costs, on campus or off." },
  { id: "arrival", title: "Arrival, travel and health", intro: "Help with the journey to campus and with staying well." },
  { id: "enrichment", title: "Experiential and enrichment", intro: "Funding for research, global study and unforeseen hardship." },
];

export const allowances: Allowance[] = [
  {
    slug: "books",
    category: "academic",
    title: "Books, Course Materials and Software Allowance",
    amount: "$1,500",
    cadence: "per academic year",
    coverage: "Issued each term as a refund, voucher or direct credit for textbooks, access codes, laboratory safety equipment, software licences and studio supplies.",
    phase: "automatic",
  },
  {
    slug: "laptop",
    category: "academic",
    title: "Laptop and Technology Allowance",
    amount: "$2,500",
    cadence: "one-time grant, first year",
    coverage: "A single grant at matriculation for a modern laptop, extended warranty and peripheral devices, or a higher-specification workstation where a technical programme requires one.",
    phase: "application",
  },
  {
    slug: "living",
    category: "living",
    title: "Personal Living Allowance",
    amount: "$4,500",
    cadence: "per academic year ($500 per month)",
    coverage: "Disbursed each semester for day-to-day personal expenses, including laundry, mobile phone service, local transport, clothing and toiletries.",
    phase: "automatic",
  },
  {
    slug: "off-campus-housing",
    category: "living",
    title: "Off-Campus Housing and Board Allowance",
    amount: "Up to $18,000",
    cadence: "per academic year (up to $1,800 per month)",
    coverage: "Where university housing and dining are not used, the room-and-board award is provided toward private rent, utilities and groceries, in line with local cost of living.",
    phase: "admitted",
    who: "Scholars who indicated a preference for off-campus housing in their application.",
    fields: [
      { name: "address", label: "Address of the rental property", type: "text", required: true },
      { name: "monthly_rent", label: "Monthly rent (US dollars)", type: "number", required: true, max: 10000 },
      { name: "lease_start", label: "Lease start date", type: "date", required: true },
      { name: "lease_months", label: "Lease length (months)", type: "number", required: true, max: 24 },
      { name: "landlord", label: "Landlord or agent name and contact", type: "text", required: true },
    ],
    documents: [
      { key: "lease", label: "Signed lease agreement", required: true },
      { key: "utilities", label: "Utility estimate or bill", required: false },
    ],
  },
  {
    slug: "settling-in",
    category: "arrival",
    title: "Settling-In Grant",
    amount: "$3,000",
    cadence: "one-time arrival grant",
    coverage: "Provided during move-in week for bedding, cold-weather clothing, luggage, kitchenware and the items needed to establish a room.",
    phase: "admitted",
    who: "All scholars in their first year.",
    fields: [
      { name: "arrival_date", label: "Expected arrival date", type: "date", required: true },
      { name: "needs", label: "Principal items you need on arrival", type: "textarea", required: true },
    ],
  },
  {
    slug: "travel",
    category: "arrival",
    title: "Annual Travel Allowance",
    amount: "$3,500",
    cadence: "per academic year",
    coverage: "Round-trip air, rail or intercity transport between the scholar’s home address and campus for autumn arrival, the winter and spring breaks, and summer departure.",
    phase: "admitted",
    who: "All scholars. Scholars in their first year request their arrival journey here.",
    fields: [
      { name: "journey", label: "Journey", type: "select", required: true, options: ["Autumn arrival", "Winter break", "Spring break", "Summer departure"] },
      { name: "from_city", label: "Departing from (city and country)", type: "text", required: true },
      { name: "from_airport", label: "Nearest international airport", type: "text", required: true },
      { name: "travel_date", label: "Preferred travel date", type: "date", required: true },
      { name: "notes", label: "Anything the travel office should know", type: "textarea" },
    ],
    documents: [{ key: "passport", label: "Passport biographical page", required: true }],
  },
  {
    slug: "health",
    category: "arrival",
    title: "Health Insurance and Medical Fee Allowance",
    amount: "$5,500",
    cadence: "per year",
    coverage: "Full payment of the premium for the university’s Comprehensive Student Health Insurance Plan, including primary care, mental health services and emergency coverage.",
    phase: "automatic",
  },
  {
    slug: "visa",
    category: "arrival",
    title: "Visa, Immigration and SEVIS Fee Reimbursement",
    amount: "Up to $800",
    cadence: "one-time, or per renewal",
    coverage: "Reimbursement of consular visa application fees, the SEVIS I-901 fee, biometrics and required pre-travel medical screening. These fees are paid by the student directly to the U.S. government and its designated providers, never to the university, and are reimbursed on presentation of official receipts.",
    phase: "admitted",
    who: "International scholars who require a U.S. student visa.",
    fields: [
      { name: "consulate", label: "U.S. embassy or consulate", type: "text", required: true },
      { name: "interview_date", label: "Visa interview date", type: "date", required: true },
      { name: "amount_paid", label: "Total paid in fees (US dollars)", type: "number", required: true, max: 800 },
    ],
    documents: [
      { key: "mrv_receipt", label: "Visa application fee (MRV) receipt", required: true },
      { key: "sevis_receipt", label: "SEVIS I-901 payment confirmation", required: true },
      { key: "medical_receipt", label: "Medical screening receipt", required: false },
    ],
  },
  {
    slug: "summer-research",
    category: "enrichment",
    title: "Summer Research and Internship Stipend",
    amount: "$8,000",
    cadence: "per summer term",
    coverage: "Institutional funding for room, board and relocation while a scholar undertakes unpaid laboratory research, public service or a non-profit internship.",
    phase: "enrolled",
    who: "Enrolled scholars in good academic standing.",
    fields: [
      { name: "title", label: "Project or internship title", type: "text", required: true },
      { name: "host", label: "Host laboratory or organisation", type: "text", required: true },
      { name: "supervisor", label: "Supervisor name", type: "text", required: true },
      { name: "supervisor_email", label: "Supervisor email", type: "email", required: true },
      { name: "start", label: "Start date", type: "date", required: true },
      { name: "end", label: "End date", type: "date", required: true },
      { name: "description", label: "Description of the work and its purpose", type: "textarea", required: true },
    ],
    documents: [{ key: "offer", label: "Offer or confirmation letter", required: true }],
  },
  {
    slug: "study-abroad",
    category: "enrichment",
    title: "Study Abroad and Global Travel Allowance",
    amount: "$7,000",
    cadence: "per semester abroad",
    coverage: "Supplemental funding for international airfare, passport and visa updates, local travel and housing differentials during university-approved exchange terms.",
    phase: "enrolled",
    who: "Enrolled scholars with an approved exchange placement.",
    fields: [
      { name: "host_university", label: "Host university", type: "text", required: true },
      { name: "country", label: "Country", type: "text", required: true },
      { name: "term", label: "Term abroad", type: "select", required: true, options: ["Fall", "Spring", "Full academic year"] },
      { name: "approval_ref", label: "Study abroad approval reference", type: "text", required: true },
    ],
    documents: [{ key: "acceptance", label: "Host university acceptance letter", required: true }],
  },
  {
    slug: "emergency",
    category: "enrichment",
    title: "Emergency and Medical Hardship Grant",
    amount: "Up to $2,000",
    cadence: "per incident",
    coverage: "Grants for unexpected financial crises, urgent dental or medical care not covered by insurance, emergency family travel, or the replacement of stolen essential equipment.",
    phase: "enrolled",
    who: "Enrolled scholars.",
    fields: [
      { name: "kind", label: "Nature of the emergency", type: "select", required: true, options: ["Medical or dental care", "Emergency family travel", "Theft or loss of essential equipment", "Other financial emergency"] },
      { name: "amount", label: "Amount requested (US dollars)", type: "number", required: true, max: 2000 },
      { name: "description", label: "Describe the circumstances", type: "textarea", required: true },
    ],
    documents: [{ key: "evidence", label: "Supporting evidence", required: true }],
  },
];

export const phaseLabels: Record<AllowancePhase, { label: string; detail: string }> = {
  automatic: { label: "Included in every award", detail: "Disbursed automatically; no request is required." },
  application: { label: "Requested in the application", detail: "Indicated in the scholarship application and confirmed at admission." },
  admitted: { label: "Requested after admission", detail: "Available in the applicant portal once the offer of admission has been accepted." },
  enrolled: { label: "Requested while enrolled", detail: "Available in the student portal once the scholar has reported to campus." },
};

export const allowanceBySlug = (slug: string) => allowances.find((a) => a.slug === slug);
