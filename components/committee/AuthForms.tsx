"use client";

import { useState } from "react";
import { api } from "@/lib/client";

function useSubmit(url: string) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [field, setField] = useState("");
  async function run(json: unknown) {
    setBusy(true);
    setError("");
    setField("");
    try {
      const r = await api<{ next?: string }>(url, { method: "POST", json });
      window.location.href = r.next ?? "/committee";
    } catch (e) {
      const x = e as Error & { data?: { field?: string } };
      setError(x.message);
      setField(String(x.data?.field ?? ""));
      setBusy(false);
    }
  }
  return { busy, error, field, run };
}

function Err({ error }: { error: string }) {
  return error ? (
    <div className="alert alert-err" role="alert">
      {error}
    </div>
  ) : null;
}

export function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const s = useSubmit("/api/committee/signin");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        s.run({ email, password });
      }}
    >
      <Err error={s.error} />
      <div className="field">
        <label htmlFor="em">Email</label>
        <input id="em" className="input" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="pw">Password</label>
        <input id="pw" className="input" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <button className="btn btn-primary btn-block" disabled={s.busy}>
        {s.busy ? "Checking…" : "Continue"}
      </button>
    </form>
  );
}

export function SetupForm() {
  const [v, setV] = useState({ token: "", name: "", email: "", password: "" });
  const s = useSubmit("/api/committee/setup");
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement>) => setV((x) => ({ ...x, [k]: e.target.value }));
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        s.run(v);
      }}
    >
      <Err error={s.error} />
      <div className="field">
        <label htmlFor="tk">Setup token</label>
        <input id="tk" className="input" autoComplete="off" required value={v.token} onChange={set("token")} aria-invalid={s.field === "token"} />
        <span className="hint">The ADMIN_SETUP_TOKEN value from the server settings.</span>
      </div>
      <div className="field">
        <label htmlFor="nm">Your name</label>
        <input id="nm" className="input" autoComplete="name" required value={v.name} onChange={set("name")} />
      </div>
      <div className="field">
        <label htmlFor="em">Email</label>
        <input id="em" className="input" type="email" autoComplete="username" required value={v.email} onChange={set("email")} aria-invalid={s.field === "email"} />
      </div>
      <div className="field">
        <label htmlFor="pw">Password</label>
        <input id="pw" className="input" type="password" autoComplete="new-password" required minLength={12} value={v.password} onChange={set("password")} aria-invalid={s.field === "password"} />
        <span className="hint">At least 12 characters. You will add an authenticator app next.</span>
      </div>
      <button className="btn btn-primary btn-block" disabled={s.busy}>
        {s.busy ? "Creating…" : "Create owner account"}
      </button>
    </form>
  );
}

export function CodeForm({ label }: { label: string }) {
  const [code, setCode] = useState("");
  const s = useSubmit("/api/committee/mfa");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        s.run({ code });
      }}
    >
      <Err error={s.error} />
      <div className="field">
        <label htmlFor="cd">{label}</label>
        <input
          id="cd"
          className="input c-code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={7}
          required
          autoFocus
          value={code}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "").slice(0, 6);
            setCode(v);
            if (v.length === 6 && !s.busy) s.run({ code: v });
          }}
        />
      </div>
      <button className="btn btn-primary btn-block" disabled={s.busy || code.length !== 6}>
        {s.busy ? "Checking…" : "Verify"}
      </button>
    </form>
  );
}
