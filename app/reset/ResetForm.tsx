"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/client";

export default function ResetForm({ token }: { token: string }) {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  if (!token)
    return (
      <div className="card">
        <h2>This link is incomplete</h2>
        <p className="sub">Please open the link from your email again, or request a new one.</p>
        <Link className="btn btn-primary btn-block mt24" href="/forgot">Request a new link</Link>
      </div>
    );

  if (done)
    return (
      <div className="card">
        <h2>Password updated</h2>
        <p className="sub">Your password has been changed. Please sign in with your new password.</p>
        <Link className="btn btn-primary btn-block mt24" href="/signin">Sign in</Link>
      </div>
    );

  return (
    <div className="card">
      <h2>Choose a new password</h2>
      {error && (
        <div className="alert alert-err mt16" role="alert">
          <span>
            {error} {/expired|used/.test(error) && <Link href="/forgot">Request a new link</Link>}
          </span>
        </div>
      )}
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (pw !== pw2) return setError("The two passwords do not match");
          setBusy(true);
          setError("");
          try {
            await api("/api/auth/reset", { method: "POST", json: { token, password: pw } });
            setDone(true);
          } catch (x) {
            setError((x as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="field">
          <label htmlFor="np">New password</label>
          <div className="pw">
            <input id="np" className="input" type={show ? "text" : "password"} autoComplete="new-password" minLength={8} required autoFocus value={pw} onChange={(e) => setPw(e.target.value)} />
            <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? "Hide password" : "Show password"}>{show ? "Hide" : "Show"}</button>
          </div>
        </div>
        <div className="field">
          <label htmlFor="np2">Confirm new password</label>
          <input id="np2" className="input" type={show ? "text" : "password"} autoComplete="new-password" minLength={8} required value={pw2} onChange={(e) => setPw2(e.target.value)} />
        </div>
        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? "Saving" : "Save new password"}</button>
      </form>
    </div>
  );
}
