"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";

const roles = [
  { v: "reviewer", label: "Reviewer", hint: "Reads applications, scores them, adds notes and opens reviews." },
  { v: "chair", label: "Committee chair", hint: "Everything a reviewer can do, plus interviews, decisions and export." },
  { v: "owner", label: "Owner", hint: "Everything, plus adding and removing committee members." },
];

function OneTime({ email, password, onClose }: { email: string; password: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="c-once stack" style={{ gap: 10 }} role="status">
      <b>One-time password for {email}</b>
      <code>{password}</code>
      <span className="small">
        Give it to them privately (not by email). It is shown only once. At first sign-in they set up an authenticator app and choose their own password at
        /committee/signin.
      </span>
      <div className="flex">
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={async () => {
            await navigator.clipboard.writeText(password).catch(() => {});
            setCopied(true);
          }}
        >
          {copied ? "Copied" : "Copy password"}
        </button>
        <button type="button" className="btn btn-primary btn-sm" onClick={onClose}>Done</button>
      </div>
    </div>
  );
}

export function AddStaff() {
  const router = useRouter();
  const [v, setV] = useState({ name: "", email: "", role: "reviewer" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [issued, setIssued] = useState<{ email: string; password: string } | null>(null);

  if (issued) return <OneTime {...issued} onClose={() => (setIssued(null), router.refresh())} />;

  return (
    <form
      className="stack"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
          const r = await api<{ password: string }>("/api/committee/staff", { method: "POST", json: v });
          setIssued({ email: v.email, password: r.password });
          setV({ name: "", email: "", role: "reviewer" });
        } catch (x) {
          setError((x as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      {error && <div className="alert alert-err">{error}</div>}
      <div className="row2">
        <div className="field">
          <label htmlFor="sn">Full name</label>
          <input id="sn" className="input" required value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} />
        </div>
        <div className="field">
          <label htmlFor="se">Email</label>
          <input id="se" className="input" type="email" required value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} />
        </div>
      </div>
      <div className="c-opts" role="radiogroup" aria-label="Role">
        {roles.map((r) => (
          <label key={r.v}>
            <input type="radio" name="role" checked={v.role === r.v} onChange={() => setV({ ...v, role: r.v })} />
            <span>
              <b>{r.label}</b>
              <span>{r.hint}</span>
            </span>
          </label>
        ))}
      </div>
      <div>
        <button className="btn btn-primary btn-sm" disabled={busy}>{busy ? "Adding…" : "Add committee member"}</button>
      </div>
    </form>
  );
}

export function StaffRowActions({ id, email, role, disabled, self }: { id: string; email: string; role: string; disabled: boolean; self: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [issued, setIssued] = useState<string | null>(null);

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    setError("");
    try {
      const r = await api<{ password?: string }>(`/api/committee/staff/${id}`, { method: "PATCH", json: body });
      if (r.password) setIssued(r.password);
      else router.refresh();
    } catch (x) {
      setError((x as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (issued) return <OneTime email={email} password={issued} onClose={() => (setIssued(null), router.refresh())} />;

  return (
    <div className="flex" style={{ justifyContent: "flex-end" }}>
      <select className="input" style={{ height: 36, width: "auto", fontSize: 13.5 }} aria-label={`Role for ${email}`} value={role} disabled={busy} onChange={(e) => patch({ role: e.target.value })}>
        {roles.map((r) => (
          <option key={r.v} value={r.v}>{r.label}</option>
        ))}
      </select>
      {!self && (
        <>
          <button
            className="btn btn-ghost btn-sm"
            disabled={busy}
            onClick={() => confirm(`Reset sign-in for ${email}? They get a new one-time password and must set up their authenticator again.`) && patch({ reset: true })}
          >
            Reset sign-in
          </button>
          <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => patch({ disabled: !disabled })}>
            {disabled ? "Turn on access" : "Turn off access"}
          </button>
        </>
      )}
      {error && <span className="small" style={{ color: "var(--err)", flexBasis: "100%", textAlign: "right" }}>{error}</span>}
    </div>
  );
}

export function PasswordForm({ first }: { first: boolean }) {
  const [v, setV] = useState({ current: "", next: "", again: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  return (
    <form
      className="stack"
      onSubmit={async (e) => {
        e.preventDefault();
        if (v.next !== v.again) return setMsg({ ok: false, text: "The new passwords don't match" });
        setBusy(true);
        setMsg(null);
        try {
          await api("/api/committee/password", { method: "POST", json: { current: v.current, next: v.next } });
          if (first) window.location.href = "/committee";
          else {
            setMsg({ ok: true, text: "Password changed" });
            setV({ current: "", next: "", again: "" });
          }
        } catch (x) {
          setMsg({ ok: false, text: (x as Error).message });
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="field">
        <label htmlFor="pc">{first ? "One-time password" : "Current password"}</label>
        <input id="pc" className="input" type="password" autoComplete="current-password" required value={v.current} onChange={(e) => setV({ ...v, current: e.target.value })} />
      </div>
      <div className="row2">
        <div className="field">
          <label htmlFor="pn">New password</label>
          <input id="pn" className="input" type="password" autoComplete="new-password" minLength={12} required value={v.next} onChange={(e) => setV({ ...v, next: e.target.value })} />
          <span className="hint">At least 12 characters.</span>
        </div>
        <div className="field">
          <label htmlFor="pa">New password again</label>
          <input id="pa" className="input" type="password" autoComplete="new-password" required value={v.again} onChange={(e) => setV({ ...v, again: e.target.value })} />
        </div>
      </div>
      {msg && <div className={`alert ${msg.ok ? "alert-ok" : "alert-err"}`} role="status">{msg.text}</div>}
      <div>
        <button className="btn btn-primary btn-sm" disabled={busy}>{busy ? "Saving…" : first ? "Set password and continue" : "Change password"}</button>
      </div>
    </form>
  );
}
