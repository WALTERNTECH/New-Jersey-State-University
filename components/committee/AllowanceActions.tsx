"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";

export function AllowanceDecision({ id, status, canDecide }: { id: string; status: string; canDecide: boolean }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  if (!canDecide) return <p className="small muted">The committee chair or owner decides allowance requests.</p>;

  async function act(action: string) {
    setBusy(action);
    setError("");
    try {
      await api(`/api/committee/allowances/${id}`, { method: "POST", json: { action, note } });
      setNote("");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  }

  const actions =
    status === "submitted" ? [["approve", "Approve", "btn-primary"], ["decline", "Decline", "btn-ghost"]] :
    status === "approved" ? [["disburse", "Mark as disbursed", "btn-primary"], ["decline", "Withdraw approval", "btn-ghost"]] :
    status === "declined" ? [["approve", "Approve instead", "btn-ghost"]] : [];
  if (!actions.length) return <p className="small muted">This request is complete.</p>;

  return (
    <div className="stack" style={{ gap: 12 }}>
      <div className="field">
        <label htmlFor="dn">
          Message to the scholar <span className="opt">Required when declining</span>
        </label>
        <textarea id="dn" className="input" style={{ minHeight: 80 }} value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      {error && <div className="alert alert-err">{error}</div>}
      <div className="flex">
        {actions.map(([a, label, cls]) => (
          <button key={a} className={`btn btn-sm ${cls}`} disabled={!!busy} onClick={() => act(a)}>
            {busy === a ? "Saving…" : label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ConfirmReported({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <span className="flex" style={{ justifyContent: "flex-end" }}>
      <button
        className="btn btn-primary btn-sm"
        disabled={busy}
        onClick={async () => {
          if (!confirm(`Confirm that ${name} has reported to campus in person? This enrols them and opens their enrolled-student allowances.`)) return;
          setBusy(true);
          setError("");
          try {
            await api(`/api/committee/applications/${id}/status`, { method: "POST", json: { status: "enrolled", note: "Reported to campus" } });
            router.refresh();
          } catch (e) {
            setError((e as Error).message);
            setBusy(false);
          }
        }}
      >
        {busy ? "Saving…" : "Confirm reported"}
      </button>
      {error && <span className="small" style={{ color: "var(--err)" }}>{error}</span>}
    </span>
  );
}
