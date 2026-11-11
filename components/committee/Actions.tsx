"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";
import { statusLabels } from "@/lib/form";

const explain: Record<string, string> = {
  under_review: "Open the review. The applicant is emailed.",
  interview: "Shortlist for a 30-minute interview. The applicant is emailed an invitation.",
  awarded: "Admit with the scholarship. The letter of admission is emailed automatically.",
  waitlisted: "Hold on the waitlist. The applicant is emailed.",
  not_selected: "Close the application. The applicant is emailed the decision.",
  submitted: "Send back to the new pile.",
};

export function StatusControl({ id, current, options, canDecide }: { id: string; current: string; options: string[]; canDecide: boolean }) {
  const router = useRouter();
  const allowed = options.filter((o) => canDecide || o === "under_review");
  const [open, setOpen] = useState(false);
  const [to, setTo] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!allowed.length) return null;

  // The common next step gets a one-click button; everything else goes through the dialog.
  const quick = current === "submitted" ? "under_review" : null;

  async function save(status: string) {
    setBusy(true);
    setError("");
    try {
      await api(`/api/committee/applications/${id}/status`, { method: "POST", json: { status, note } });
      setOpen(false);
      setNote("");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {quick && allowed.includes(quick) ? (
        <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => save(quick)}>
          {busy ? "Opening…" : "Start review"}
        </button>
      ) : null}
      {(!quick || allowed.length > 1) && (
        <button className={`btn btn-sm ${quick ? "btn-ghost" : "btn-primary"}`} onClick={() => (setTo(""), setError(""), setOpen(true))}>
          {canDecide ? "Change stage" : "Move"}
        </button>
      )}
      {error && !open && <span className="small" style={{ color: "var(--err)" }}>{error}</span>}
      {open && (
        <div className="c-dialog" role="dialog" aria-modal="true" aria-labelledby="stt" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="sheet">
            <header>
              <h2 id="stt">Move this application</h2>
              <button className="c-x" aria-label="Close" onClick={() => setOpen(false)}>×</button>
            </header>
            <div className="body">
              <div className="c-opts" role="radiogroup">
                {allowed.map((o) => (
                  <label key={o}>
                    <input type="radio" name="to" checked={to === o} onChange={() => setTo(o)} />
                    <span>
                      <b>{statusLabels[o]}</b>
                      <span>{explain[o]}</span>
                    </span>
                  </label>
                ))}
              </div>
              <div className="field">
                <label htmlFor="sn">
                  Reason <span className="opt">Optional, committee only</span>
                </label>
                <textarea id="sn" className="input" style={{ minHeight: 90 }} value={note} onChange={(e) => setNote(e.target.value)} />
              </div>
              {error && <div className="alert alert-err" role="alert">{error}</div>}
            </div>
            <footer>
              <button className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm" disabled={busy || !to} onClick={() => save(to)}>
                {busy ? "Saving…" : to ? `Move to ${statusLabels[to]?.toLowerCase()}` : "Choose a stage"}
              </button>
            </footer>
          </div>
        </div>
      )}
    </>
  );
}

const crit = [
  { key: "academic", label: "Academic promise", hint: "Grades and education so far, given their circumstances" },
  { key: "need", label: "Financial need", hint: "Household income, size and situation" },
  { key: "essays", label: "Essays", hint: "Clarity of purpose, reflection, their own voice" },
  { key: "potential", label: "Character and potential", hint: "Resilience, purpose and contribution, from the essays and any interview" },
] as const;
type Key = (typeof crit)[number]["key"];

export function ScoreForm({ id, initial, open, opensReview }: { id: string; initial: Partial<Record<Key, number>> & { comment?: string | null }; open: boolean; opensReview?: boolean }) {
  const router = useRouter();
  const [v, setV] = useState<Partial<Record<Key, number>>>({ academic: initial.academic, need: initial.need, essays: initial.essays, potential: initial.potential });
  const [comment, setComment] = useState(initial.comment ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const complete = crit.every((c) => v[c.key]);
  const total = crit.reduce((a, c) => a + (v[c.key] ?? 0), 0);

  if (!open) return <p className="small muted">Scoring is open while an application is new, under review or at interview.</p>;

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      await api(`/api/committee/applications/${id}/score`, { method: "POST", json: { ...v, comment } });
      setMsg({ ok: true, text: "Score saved" });
      router.refresh();
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="c-score">
      {crit.map((c) => (
        <div className="crit" key={c.key} role="group" aria-labelledby={`cr_${c.key}`}>
          <label id={`cr_${c.key}`}>
            {c.label}
            <span className="muted" style={{ fontWeight: 400 }}>{v[c.key] ?? "–"}/5</span>
          </label>
          <div className="c-pips">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" aria-pressed={v[c.key] === n} aria-label={`${c.label} ${n} of 5`} onClick={() => setV((x) => ({ ...x, [c.key]: n }))}>
                {n}
              </button>
            ))}
          </div>
          <span className="small muted">{c.hint}</span>
        </div>
      ))}
      <div className="field">
        <label htmlFor="sc">Comment <span className="opt">Optional</span></label>
        <textarea id="sc" className="input" style={{ minHeight: 80 }} value={comment} onChange={(e) => setComment(e.target.value)} />
      </div>
      <div className="flex" style={{ justifyContent: "space-between" }}>
        <span className="c-total">
          <b>{total}</b> <span className="muted">/ 20</span>
        </span>
        <button className="btn btn-primary btn-sm" disabled={!complete || busy} onClick={save}>
          {busy ? "Saving…" : initial.academic ? "Update score" : "Save score"}
        </button>
      </div>
      {opensReview && !msg && <p className="small muted">Saving the first score moves this application to “Under review” and lets the applicant know.</p>}
      {msg && <div className={`alert ${msg.ok ? "alert-ok" : "alert-err"}`} role="status">{msg.text}</div>}
    </div>
  );
}

/** Issues a temporary password once the Office has verified an applicant's identity. Shown once. */
export function ResetApplicantPassword({ id, email }: { id: string; email: string }) {
  const [busy, setBusy] = useState(false);
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  if (pw)
    return (
      <div className="c-once stack" style={{ gap: 8 }} role="status">
        <b>Temporary password for {email}</b>
        <code>{pw}</code>
        <span className="small">Shown once. Give it to the applicant only after verifying their identity. They must replace it when they next sign in.</span>
        <div><button className="btn btn-ghost btn-sm" onClick={() => setPw("")}>Done</button></div>
      </div>
    );
  return (
    <>
      <button
        className="btn btn-ghost btn-sm"
        disabled={busy}
        onClick={async () => {
          if (!confirm(`Issue a temporary password for ${email}? Their current password stops working and they are signed out everywhere.`)) return;
          setBusy(true);
          setError("");
          try {
            const r = await api<{ password: string }>(`/api/committee/applications/${id}/reset-password`, { method: "POST" });
            setPw(r.password);
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "Issuing…" : "Issue temporary password"}
      </button>
      {error && <span className="small" style={{ color: "var(--err)" }}>{error}</span>}
    </>
  );
}

export function NoteForm({ id }: { id: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <form
      className="c-card-b stack"
      style={{ gap: 10 }}
      onSubmit={async (e) => {
        e.preventDefault();
        if (!body.trim()) return;
        setBusy(true);
        setError("");
        try {
          await api(`/api/committee/applications/${id}/notes`, { method: "POST", json: { body } });
          setBody("");
          router.refresh();
        } catch (x) {
          setError((x as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <textarea className="input" style={{ minHeight: 80 }} placeholder="Add a note for the committee. Applicants never see notes." aria-label="New note" value={body} onChange={(e) => setBody(e.target.value)} />
      {error && <div className="alert alert-err">{error}</div>}
      <div>
        <button className="btn btn-ghost btn-sm" disabled={busy || !body.trim()}>
          {busy ? "Adding…" : "Add note"}
        </button>
      </div>
    </form>
  );
}
