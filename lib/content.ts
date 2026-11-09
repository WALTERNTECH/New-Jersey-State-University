// Every programme fact shown on the site lives here, so the scholarship office can change
// dates, coverage and contact details in one place.

export const programme = {
  university: "New Jersey State University",
  short: "NJSU",
  name: "NJSU Access Scholarship",
  cycle: "2027 Entry",
  cycleCode: "2027",
  years: 4,
  startTerm: "Fall 2027",
  opens: "9 November 2026",
  deadline: "15 March 2027",
  deadlineISO: "2027-03-15T23:59:59-05:00",
  interviews: "April 2027",
  decisions: "15 May 2027",
  // Shown in the footer and on help prompts only when set.
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "",
  contactPhone: process.env.NEXT_PUBLIC_CONTACT_PHONE ?? "",
};

export const coverage = [
  { title: "Full tuition and fees", body: "Every tuition charge and required university fee, for all eight semesters of a bachelor's degree." },
  { title: "Housing and meals", body: "A place in university housing and a full meal plan for each academic year." },
  { title: "Books and a laptop", body: "Required course materials each semester, and a laptop issued in your first term." },
  { title: "Advising and mentoring", body: "A dedicated scholarship advisor and a faculty mentor from your first week to graduation." },
];

export const eligibility = [
  "You have completed secondary or high school, or will complete it before the programme starts.",
  "Your household cannot meet the cost of a university education without support.",
  "You have not already earned a bachelor's degree.",
  "You will be at least 16 years old when studies begin.",
  "You can study in English, or are willing to complete a short English preparation course.",
];

export const timeline = [
  { when: programme.opens, title: "Applications open", body: "Create an account and start your application. It saves as you go." },
  { when: programme.deadline, title: "Application deadline", body: "Submit by 11:59 pm Eastern Time. Supporting documents can follow within 14 days." },
  { when: programme.interviews, title: "Interviews", body: "Shortlisted applicants are invited to a 30-minute video conversation." },
  { when: programme.decisions, title: "Decisions", body: "Every applicant hears from us by email and in their applicant portal." },
  { when: programme.startTerm, title: "Studies begin", body: "Scholars arrive for orientation in late August." },
];

export const faqs = [
  { q: "Is there an application fee?", a: "No. Applying for the Access Scholarship is free, and NJSU will never ask you to pay to apply, to hold a place or to release an award." },
  { q: "Do I need to finish in one sitting?", a: "No. Your application saves after every change. Sign in from any device to continue where you stopped." },
  { q: "Which documents will I need?", a: "A form of identification and your most recent academic transcript or certificate. Proof of household income and evidence of English ability help us, but you can submit without them and add them within 14 days." },
  { q: "Can international students apply?", a: "Yes. The scholarship is open to applicants from any country who meet the eligibility requirements." },
  { q: "What does the scholarship not cover?", a: "Travel to the United States, visa fees and personal expenses are not covered. Scholars can apply to the hardship fund once enrolled." },
  { q: "Who do I ask for a recommendation?", a: "A teacher, school principal, employer or community leader who knows you well. You only give us their name and email; we contact them after you submit." },
  { q: "How will I know my result?", a: "Your applicant portal shows the status of your application at every stage. Decisions are released there and by email." },
];

export const programmes = [
  "Business Administration",
  "Computer Science",
  "Nursing",
  "Education",
  "Health Science",
  "Engineering Technology",
  "Psychology",
  "Undecided",
];
