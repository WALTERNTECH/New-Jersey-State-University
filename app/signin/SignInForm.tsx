"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/client";
import { programme } from "@/lib/content";

export default function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [forgot, setForgot] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/api/auth/signin", { method: "POST", json: { email, password } });
      window.location.href = "/portal";
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <h2>Sign in</h2>
      <p className="sub">Use the email and password you applied with.</p>
      {error && (
        <div className="alert alert-err mt16" role="alert">
          {error}
        </div>
      )}
      <form onSubmit={submit}>
        <div className="field">
          <label htmlFor="em">Email</label>
          <input id="em" className="input" type="email" autoComplete="email" inputMode="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <div className="flex" style={{ justifyContent: "space-between" }}>
            <label htmlFor="pw">Password</label>
            <button type="button" className="textlink small" onClick={() => setForgot((v) => !v)}>
              Forgot password?
            </button>
          </div>
          <div className="pw">
            <input id="pw" className="input" type={show ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? "Hide password" : "Show password"}>
              {show ? "Hide" : "Show"}
            </button>
          </div>
        </div>
        {forgot && (
          <div className="alert alert-info" role="status">
            <span>
              Contact the scholarship office{programme.contactEmail ? <> at <a href={`mailto:${programme.contactEmail}`}>{programme.contactEmail}</a></> : ""} with
              your full name and the email you applied with, and we will reset your access.
            </span>
          </div>
        )}
        <button className="btn btn-primary btn-block" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="small muted center mt24">
        New applicant? <Link href="/apply">Start an application</Link>
      </p>
    </div>
  );
}
