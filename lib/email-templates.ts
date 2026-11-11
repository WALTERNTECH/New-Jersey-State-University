import { programme } from "./content";

// Every message the portal sends, written once. Params are stored with each email so it can be resent.

export type EmailKind =
  | "welcome"
  | "submitted"
  | "stage"
  | "awarded"
  | "offer_accepted"
  | "offer_declined"
  | "document_rejected"
  | "cleared"
  | "enrolled"
  | "allowance"
  | "password_reset";

export const emailKindLabels: Record<string, string> = {
  welcome: "Account created",
  submitted: "Application received",
  stage: "Stage update",
  awarded: "Offer and letter of admission",
  offer_accepted: "Offer accepted",
  offer_declined: "Offer declined",
  document_rejected: "Document to replace",
  cleared: "Cleared to report",
  enrolled: "Enrolment confirmed",
  allowance: "Allowance decision",
  password_reset: "Password reset link",
};

export type Params = Record<string, string>;

interface Content {
  subject: string;
  preheader: string;
  heading: string;
  paras: string[];
  list?: string[];
  button?: { label: string; path: string };
  after?: string[];
}

const esc = (s: string) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function content(kind: string, p: Params): Content {
  const name = p.name || "applicant";
  switch (kind) {
    case "welcome":
      return {
        subject: "Your NJSU Access Scholarship application account",
        preheader: `Your application reference is ${p.reference}.`,
        heading: `Welcome, ${name}`,
        paras: [
          `Your applicant account for the ${programme.name} has been created. Your application reference is ${p.reference}; please quote it in any correspondence with the Office.`,
          `Your application saves as you go, so you may complete it over several sessions and from any device. Applications close on ${programme.deadline} at 11:59 p.m. Eastern Time.`,
        ],
        button: { label: "Continue your application", path: "/portal" },
        after: ["If you did not create this account, you may disregard this message."],
      };
    case "submitted":
      return {
        subject: `Application received: ${p.reference}`,
        preheader: "Thank you for applying to the NJSU Access Scholarship.",
        heading: `Thank you, ${name}`,
        paras: [
          `Your application for the ${programme.name} has been received by the Office of Admissions. Your reference is ${p.reference}.`,
          `The Scholarship Committee reviews applications after the deadline. Shortlisted candidates are invited to interview in ${programme.interviews}, and all candidates are notified of their decision by ${programme.decisions}.`,
          "Supplementary documents may still be added in the applicant portal, where you can follow each stage of the review.",
        ],
        button: { label: "View your application", path: "/portal" },
      };
    case "stage": {
      const s = p.status;
      if (s === "under_review")
        return {
          subject: "Your application is under review",
          preheader: "The Scholarship Committee has begun its review.",
          heading: "Your application is under review",
          paras: [`Dear ${name},`, `The Scholarship Committee has begun its review of your application (${p.reference}). No action is required of you at this time; we will write to you again when there is news.`],
          button: { label: "Follow your application", path: "/portal" },
        };
      if (s === "interview")
        return {
          subject: "Invitation to interview: NJSU Access Scholarship",
          preheader: "You have been shortlisted for interview.",
          heading: "You have been shortlisted",
          paras: [
            `Dear ${name},`,
            "Congratulations. The Scholarship Committee has shortlisted your application for interview.",
            "The Office of Admissions will contact you shortly to arrange a 30-minute conversation by video with members of the Committee, at a time convenient to you.",
          ],
          button: { label: "View your application", path: "/portal" },
        };
      if (s === "waitlisted")
        return {
          subject: "Your admission decision",
          preheader: "An update on your application.",
          heading: "You have been placed on the waitlist",
          paras: [
            `Dear ${name},`,
            "The Committee was impressed by your application and has placed you on the waitlist. Should a place become available, you will be notified at once by email and in the applicant portal.",
          ],
          button: { label: "View your application", path: "/portal" },
        };
      return {
        subject: "Your admission decision",
        preheader: "An update on your application.",
        heading: "Your admission decision",
        paras: [
          `Dear ${name},`,
          "We regret that we are unable to offer you admission with the Access Scholarship this year. The Committee received many exceptional applications, and its decisions reflect the limited number of places rather than any shortcoming in your achievements.",
          "We encourage you to apply in a future cycle, and wish you every success.",
        ],
      };
    }
    case "awarded":
      return {
        subject: "Offer of admission: NJSU Access Scholarship",
        preheader: "Your letter of admission is attached.",
        heading: `Congratulations, ${name}`,
        paras: [
          `It is my pleasure to offer you admission to ${programme.university} for ${programme.startTerm}, with the ${programme.name}. Your letter of admission is attached to this email and can be downloaded from the applicant portal at any time.`,
          `Please sign in to review the terms of your award and reply to this offer by ${programme.replyBy}.`,
          "Once you accept, the portal will guide you through the remaining steps: your identification documents, your arrival plan and your pre-arrival allowances.",
        ],
        button: { label: "Reply to your offer", path: "/portal" },
      };
    case "offer_accepted":
      return {
        subject: "Your place is confirmed: next steps",
        preheader: "Thank you for accepting your offer.",
        heading: "Thank you for accepting your offer",
        paras: [`Dear ${name},`, "We are delighted that you will join us. Please complete the following in the applicant portal:"],
        list: [
          "Upload your identification documents: your passport biographical page, a passport-style photograph and your immunisation record.",
          "Submit your arrival plan and an emergency contact.",
          "Request your pre-arrival allowances, such as travel and settling-in.",
        ],
        after: ["Once the Office has verified your documents and arrival plan, we will write to confirm that you are cleared to report to campus."],
        button: { label: "Open the applicant portal", path: "/portal" },
      };
    case "offer_declined":
      return {
        subject: "We have recorded your reply",
        preheader: "You have declined your offer of admission.",
        heading: "Your reply has been recorded",
        paras: [
          `Dear ${name},`,
          "We have recorded your decision to decline your offer of admission. We wish you every success in your studies.",
          "If you declined in error, please contact the Office of Admissions without delay.",
        ],
      };
    case "document_rejected":
      return {
        subject: "Action needed: please replace a document",
        preheader: `Your ${p.document} needs to be replaced.`,
        heading: "Please replace a document",
        paras: [
          `Dear ${name},`,
          `The Office was unable to accept your ${p.document}${p.note ? ` for the following reason: ${p.note}` : "."}`,
          "Please upload a replacement in the applicant portal. A clear phone photograph of the document is acceptable.",
        ],
        button: { label: "Upload a replacement", path: "/portal" },
      };
    case "cleared":
      return {
        subject: "You are cleared to report to campus",
        preheader: "Your documents and arrival plan are complete.",
        heading: "You are cleared to report",
        paras: [
          `Dear ${name},`,
          "Your identification documents have been verified and your arrival plan is on file. You are cleared to report to campus.",
          `Please present yourself at registration in ${programme.arrival} with your passport, a printed copy of your letter of admission and your original academic certificates. Your enrolment is confirmed in person.`,
        ],
        button: { label: "View your arrival details", path: "/portal" },
      };
    case "enrolled":
      return {
        subject: `Welcome to ${programme.university}`,
        preheader: "Your enrolment is confirmed.",
        heading: `Welcome to ${programme.university}`,
        paras: [
          `Dear ${name},`,
          "Your enrolment as an Access Scholar is confirmed. Allowances for enrolled students, including summer research, study abroad and emergency support, are now open to you in the portal.",
        ],
        button: { label: "Open the portal", path: "/portal" },
      };
    case "allowance": {
      const verdict =
        p.status === "approved" ? "has been approved" : p.status === "disbursed" ? "has been disbursed" : "could not be approved";
      return {
        subject: `Your ${p.allowance} request`,
        preheader: `Your request ${verdict}.`,
        heading: `Your request ${verdict}`,
        paras: [
          `Dear ${name},`,
          `Your request for the ${p.allowance} ${verdict}.${p.note ? ` ${p.status === "declined" ? "Reason" : "Note from the Office"}: ${p.note}` : ""}`,
          p.status === "approved"
            ? "The Office of the Bursar will arrange payment in person. The University never asks for bank or card details by email or online."
            : p.status === "declined"
              ? "You may submit a new request in the portal if your circumstances change."
              : "Thank you. No further action is required.",
        ],
        button: { label: "View your requests", path: "/portal/allowances" },
      };
    }
    case "password_reset":
      return {
        subject: "Reset your password",
        preheader: "A link to choose a new password.",
        heading: "Reset your password",
        paras: [
          `Dear ${name},`,
          "We received a request to reset the password for your applicant account. The link below can be used once and expires in 30 minutes.",
        ],
        button: { label: "Choose a new password", path: p.reset_path || "/forgot" },
        after: ["If you did not request this, you may ignore this email; your password will not change."],
      };
    default:
      return { subject: "A message from NJSU Admissions", preheader: "", heading: "A message from NJSU Admissions", paras: [] };
  }
}

export function renderEmail(kind: string, p: Params, site: string) {
  const c = content(kind, p);
  const url = c.button ? site + c.button.path : null;
  const P = (s: string) => `<p style="margin:0 0 16px">${esc(s)}</p>`;
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(c.subject)}</title></head>
<body style="margin:0;padding:0;background:#f3f5f8">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(c.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f5f8;padding:28px 12px">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e3e7ee;border-radius:10px;overflow:hidden">
<tr><td style="background:#06243c;padding:20px 28px;border-bottom:3px solid #eabb13">
<table role="presentation" cellpadding="0" cellspacing="0"><tr>
<td style="padding-right:12px;vertical-align:middle"><div style="background:#ffffff;border-radius:6px;padding:4px"><img src="${site}/email-crest.png" width="34" height="32" alt="" style="display:block;border:0"></div></td>
<td style="vertical-align:middle"><div style="color:#ffffff;font:600 18px Georgia,'Times New Roman',serif">${esc(programme.university)}</div>
<div style="color:#9fb2c6;font:11px Arial,Helvetica,sans-serif;letter-spacing:.08em;text-transform:uppercase;margin-top:3px">Admissions and Financial Aid</div></td>
</tr></table>
</td></tr>
<tr><td style="padding:30px 28px 10px;font:15.5px/1.6 Arial,Helvetica,sans-serif;color:#1d2733">
<h1 style="margin:0 0 18px;font:600 23px/1.3 Georgia,'Times New Roman',serif;color:#06243c">${esc(c.heading)}</h1>
${c.paras.map(P).join("\n")}
${c.list ? `<ol style="margin:0 0 16px;padding-left:20px">${c.list.map((li) => `<li style="margin:0 0 8px">${esc(li)}</li>`).join("")}</ol>` : ""}
${(c.after ?? []).map(P).join("\n")}
${url ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 22px"><tr><td style="background:#06243c;border-radius:6px"><a href="${esc(url)}" style="display:inline-block;padding:12px 22px;font:600 15px Arial,Helvetica,sans-serif;color:#ffffff;text-decoration:none">${esc(c.button!.label)}</a></td></tr></table>` : ""}
</td></tr>
<tr><td style="padding:18px 28px 24px;border-top:1px solid #eef1f5;font:12.5px/1.6 Arial,Helvetica,sans-serif;color:#6b7684">
${esc(programme.office)}<br>${esc(programme.university)}<br>
We never charge applicants. Ignore any request for payment in our name.
</td></tr>
</table>
</td></tr></table>
</body></html>`;
  const text = [
    c.heading,
    "",
    ...c.paras.flatMap((s) => [s, ""]),
    ...(c.list ?? []).map((s, i) => `${i + 1}. ${s}`),
    ...(c.list ? [""] : []),
    ...(c.after ?? []).flatMap((s) => [s, ""]),
    ...(url ? [`${c.button!.label}: ${url}`, ""] : []),
    "--",
    programme.office,
    programme.university,
    "We never charge applicants. Ignore any request for payment in our name.",
  ].join("\n");
  return { subject: c.subject, html, text };
}
