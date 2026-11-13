"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/client";
import { programme } from "@/lib/content";

export default function SignInForm({ next, emailReset }: { next: string; emailReset: boolean }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [caps, setCaps] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [forgot, setForgot] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await api<{ next?: string | null }>("/api/auth/signin", { method: "POST", json: { email, password } });
      window.location.href = r.next ?? next;
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  const capsCheck = (e: React.KeyboardEvent) => setCaps(e.getModifierState?.("CapsLock") ?? false);

  return (
    <div className="card">
      <h2>Sign in</h2>
      {error && (
        <div className="alert alert-err mt16" role="alert">
          {error}
        </div>
      )}
      <form onSubmit={submit}>
        <div className="field">
          <label htmlFor="em">Email address</label>
          <input id="em" className="input" type="email" autoComplete="email" inputMode="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <div className="flex" style={{ justifyContent: "space-between" }}>
            <label htmlFor="pw">Password</label>
            {emailReset ? (
              <Link className="small" href="/forgot">Forgotten your password?</Link>
            ) : (
              <button type="button" className="textlink small" onClick={() => setForgot((v) => !v)} aria-expanded={forgot}>
                Forgotten your password?
              </button>
            )}
          </div>
          <div className="pw">
            <input
              id="pw"
              className="input"
              type={show ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyUp={capsCheck}
              onKeyDown={capsCheck}
            />
            <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? "Hide password" : "Show password"}>
              {show ? "Hide" : "Show"}
            </button>
          </div>
          {caps && <span className="capslock">Caps Lock is on</span>}
        </div>
        {forgot && (
          <div className="alert alert-info" role="status">
            <span>
              Contact the Office of Admissions{programme.contactEmail ? <> at <a href={`mailto:${programme.contactEmail}`}>{programme.contactEmail}</a></> : ""} to reset your password.
            </span>
          </div>
        )}
        <button className="btn btn-primary btn-block" disabled={busy}>
          {busy ? "Signing in" : "Sign in"}
        </button>
      </form>
      <div className="divider mt24">or</div>
      <Link className="btn btn-ghost btn-block mt16" href="/apply">
        Start an application
      </Link>
    </div>
  );
}
