import { statusLabels } from "@/lib/form";

export const statusColors: Record<string, string> = {
  draft: "#c9cfd8",
  submitted: "#eabb13",
  under_review: "#2f6db0",
  interview: "#7c5cc4",
  awarded: "#157347",
  waitlisted: "#d9822b",
  not_selected: "#8b95a3",
  accepted: "#0f5a37",
  declined_offer: "#b8bec8",
  enrolled: "#06243c",
};

export function StatusChip({ status }: { status: string }) {
  return <span className={`c-st ${status}`}>{statusLabels[status] ?? status}</span>;
}

export const when = (s: string | null | undefined) => {
  if (!s) return "";
  const d = new Date(s);
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  if (mins < 60 * 24) return `${Math.round(mins / 60)} h ago`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: d.getFullYear() === new Date().getFullYear() ? undefined : "numeric" });
};

export const actionLabels: Record<string, string> = {
  setup: "set up the console",
  signin: "signed in",
  signin_failed: "failed a password sign-in",
  mfa_failed: "entered a wrong code",
  mfa_enrolled: "added an authenticator",
  password_changed: "changed their password",
  view_application: "opened",
  view_document: "viewed a document of",
  status_change: "changed the status of",
  note: "added a note to",
  score: "scored",
  staff_added: "added committee member",
  staff_role: "changed the role of",
  staff_disabled: "turned off access for",
  staff_enabled: "turned on access for",
  staff_reset: "reset the sign-in of",
  export: "exported applications",
  allowance_approved: "approved an allowance for",
  allowance_declined: "declined an allowance for",
  allowance_disbursed: "recorded an allowance disbursement for",
  applicant_reset: "issued a temporary password to",
};

export function Bars({ rows }: { rows: { label: string; n: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.n));
  if (!rows.length) return <p className="c-empty">Nothing yet</p>;
  return (
    <div className="c-bars">
      {rows.map((r) => (
        <div className="row" key={r.label}>
          <div>
            <div className="lbl">
              <span>{r.label}</span>
            </div>
            <div className="track">
              <i style={{ width: `${(r.n / max) * 100}%` }} />
            </div>
          </div>
          <span className="n">{r.n}</span>
        </div>
      ))}
    </div>
  );
}
