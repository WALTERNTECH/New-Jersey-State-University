"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";
import { statusLabels } from "@/lib/form";

/** Verify or reject one identification document. Rejecting emails the scholar the reason. */
export function DocReview({ id, label }: { id: string; label: string }) {
  const router = useRouter();
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  async function act(action: "verify" | "reject") {
    setBusy(action);
    setError("");
    try {
      await api(`/api/committee/documents/${id}`, { method: "POST", json: { action, note } });
      setRejecting(false);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  }

  if (rejecting)
    return (
      <div className="stack" style={{ gap: 8, width: "100%" }}>
        <label className="small" htmlFor={`rj_${id}`}>What should the scholar fix? They receive this by email.</label>
        <input id={`rj_${id}`} className="input" autoFocus placeholder={`e.g. The ${label.toLowerCase()} is blurred; please upload a clearer photo`} value={note} onChange={(e) => setNote(e.target.value)} />
        {error && <span className="small" style={{ color: "var(--err)" }}>{error}</span>}
        <span className="flex">
          <button className="btn btn-primary btn-sm" disabled={!!busy || !note.trim()} onClick={() => act("reject")}>{busy ? "Sending…" : "Ask for a replacement"}</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setRejecting(false)}>Cancel</button>
        </span>
      </div>
    );
  return (
    <span className="flex">
      <button className="btn btn-primary btn-sm" disabled={!!busy} onClick={() => act("verify")}>{busy === "verify" ? "Saving…" : "Verify"}</button>
      <button className="btn btn-ghost btn-sm" disabled={!!busy} onClick={() => (setNote(""), setError(""), setRejecting(true))}>Reject</button>
      {error && <span className="small" style={{ color: "var(--err)" }}>{error}</span>}
    </span>
  );
}

/** Emails the letter of admission to the candidate again. */
export function ResendLetter({ id }: { id: string }) {
  const [state, setState] = useState<"" | "busy" | "done" | string>("");
  return (
    <span className="flex">
      <button
        className="btn btn-ghost btn-sm"
        disabled={state === "busy"}
        onClick={async () => {
          setState("busy");
          try {
            await api(`/api/committee/applications/${id}/letter`, { method: "POST" });
            setState("done");
          } catch (e) {
            setState((e as Error).message);
          }
        }}
      >
        {state === "busy" ? "Sending…" : state === "done" ? "Sent again" : "Email it again"}
      </button>
      {state && !["busy", "done"].includes(state) && <span className="small" style={{ color: "var(--err)" }}>{state}</span>}
    </span>
  );
}

/** Resend one logged email, or every email that has not gone out. */
export function ResendEmail({ id, all, disabled }: { id?: string; all?: boolean; disabled?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <span className="flex">
      <button
        className={`btn btn-sm ${all ? "btn-primary" : "btn-ghost"}`}
        disabled={busy || disabled}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            await api("/api/committee/emails", { method: "POST", json: all ? { all: true } : { id } });
            setTimeout(() => router.refresh(), 1500);
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setTimeout(() => setBusy(false), 1500);
          }
        }}
      >
        {busy ? "Sending…" : all ? "Send all unsent emails" : "Resend"}
      </button>
      {error && <span className="small" style={{ color: "var(--err)" }}>{error}</span>}
    </span>
  );
}

const bulkExplain: Record<string, string> = {
  under_review: "Open the review. Each applicant is emailed.",
  interview: "Shortlist for interview. Each applicant is emailed an invitation.",
  awarded: "Admit with the scholarship. Each receives their letter of admission by email.",
  waitlisted: "Place on the waitlist. Each applicant is emailed.",
  not_selected: "Close these applications. Each applicant is emailed the decision.",
};

/**
 * Selecting rows in the applications table: checkboxes named "pick" anywhere on the page feed this bar.
 * Each application is moved and emailed exactly as if it were moved on its own.
 */
export function BulkBar({ canDecide }: { canDecide: boolean }) {
  const router = useRouter();
  const [ids, setIds] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [to, setTo] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const options = canDecide ? Object.keys(bulkExplain) : ["under_review"];

  useEffect(() => {
    const read = () => setIds(Array.from(document.querySelectorAll<HTMLInputElement>('input[name="pick"]:checked')).map((i) => i.value));
    const onChange = (e: Event) => {
      const t = e.target as HTMLInputElement;
      if (t.name === "pickall") document.querySelectorAll<HTMLInputElement>('input[name="pick"]').forEach((i) => (i.checked = t.checked));
      if (t.name === "pick" || t.name === "pickall") read();
    };
    document.addEventListener("change", onChange);
    read();
    return () => document.removeEventListener("change", onChange);
  }, []);

  async function apply() {
    setBusy(true);
    setMsg(null);
    try {
      const r = await api<{ moved: number; skipped: number; reasons: string[] }>("/api/committee/applications/bulk", { method: "POST", json: { ids, status: to } });
      setMsg({
        ok: r.skipped === 0,
        text: `${r.moved} moved to ${statusLabels[to].toLowerCase()}${r.skipped ? `; ${r.skipped} skipped (${r.reasons.join("; ")})` : ""}.`,
      });
      setOpen(false);
      document.querySelectorAll<HTMLInputElement>('input[name="pick"], input[name="pickall"]').forEach((i) => (i.checked = false));
      setIds([]);
      router.refresh();
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {(ids.length > 0 || msg) && (
        <div className="c-bulk" role="region" aria-label="Selected applications">
          {ids.length > 0 ? (
            <>
              <b>{ids.length} selected</b>
              <button className="btn btn-primary btn-sm" onClick={() => (setTo(""), setOpen(true))}>Move selected</button>
            </>
          ) : (
            <span className={msg!.ok ? "" : "err"}>{msg!.text}</span>
          )}
          {msg && ids.length === 0 && <button className="c-x" aria-label="Dismiss" onClick={() => setMsg(null)}>×</button>}
        </div>
      )}
      {open && (
        <div className="c-dialog" role="dialog" aria-modal="true" aria-labelledby="bkt" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="sheet">
            <header>
              <h2 id="bkt">Move {ids.length} application{ids.length === 1 ? "" : "s"}</h2>
              <button className="c-x" aria-label="Close" onClick={() => setOpen(false)}>×</button>
            </header>
            <div className="body">
              <div className="c-opts" role="radiogroup">
                {options.map((o) => (
                  <label key={o}>
                    <input type="radio" name="bulkto" checked={to === o} onChange={() => setTo(o)} />
                    <span>
                      <b>{statusLabels[o]}</b>
                      <span>{bulkExplain[o]}</span>
                    </span>
                  </label>
                ))}
              </div>
              <p className="small muted">Applications that can't make this move from their current stage are skipped and listed afterwards.</p>
            </div>
            <footer>
              <button className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm" disabled={busy || !to} onClick={apply}>
                {busy ? "Moving…" : to ? `Move to ${statusLabels[to].toLowerCase()}` : "Choose a stage"}
              </button>
            </footer>
          </div>
        </div>
      )}
    </>
  );
}
