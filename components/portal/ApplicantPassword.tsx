"use client";

import { useState } from "react";
import { api } from "@/lib/client";

export default function ApplicantPassword({ required }: { required: boolean }) {
  const [v, setV] = useState({ current: "", next: "", again: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (v.next !== v.again) return setMsg({ ok: false, text: "The new passwords do not match." });
        setBusy(true);
        setMsg(null);
        try {
          await api("/api/auth/password", { method: "POST", json: { current: v.current, next: v.next } });
          window.location.href = "/portal";
        } catch (x) {
          setMsg({ ok: false, text: (x as Error).message });
          setBusy(false);
        }
      }}
    >
      <div className="field">
        <label htmlFor="cur">{required ? "Temporary password" : "Current password"}</label>
        <input id="cur" className="input" type="password" autoComplete="current-password" required value={v.current} onChange={(e) => setV({ ...v, current: e.target.value })} />
      </div>
      <div className="field">
        <label htmlFor="nw">New password</label>
        <input id="nw" className="input" type="password" autoComplete="new-password" minLength={8} required value={v.next} onChange={(e) => setV({ ...v, next: e.target.value })} />
        <span className="hint">At least 8 characters.</span>
      </div>
      <div className="field">
        <label htmlFor="ag">Confirm new password</label>
        <input id="ag" className="input" type="password" autoComplete="new-password" required value={v.again} onChange={(e) => setV({ ...v, again: e.target.value })} />
      </div>
      {msg && <div className={`alert ${msg.ok ? "alert-ok" : "alert-err"}`} role="alert">{msg.text}</div>}
      <button className="btn btn-primary btn-block" disabled={busy}>{busy ? "Saving…" : "Save new password"}</button>
    </form>
  );
}
