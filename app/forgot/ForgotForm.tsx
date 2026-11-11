"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/client";

export default function ForgotForm({ enabled, contactEmail }: { enabled: boolean; contactEmail: string }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  if (!enabled)
    return (
      <div className="card">
        <h2>Reset your password</h2>
        <div className="alert alert-info mt16" role="status">
          <span>
            Please write to the Office of Admissions{contactEmail ? <> at <a href={`mailto:${contactEmail}`}>{contactEmail}</a></> : ""} from the email address on your
            application, giving your full name and application reference. Once your identity has been verified, you will be issued a temporary password.
          </span>
        </div>
        <Link className="btn btn-ghost btn-block mt24" href="/signin">Return to sign in</Link>
      </div>
    );

  if (sent)
    return (
      <div className="card">
        <h2>Check your email</h2>
        <p className="sub">
          If an application exists for <b>{email}</b>, we have sent it a link to choose a new password. The link expires in 30 minutes. Please check your spam folder if it
          does not arrive within a few minutes.
        </p>
        <Link className="btn btn-ghost btn-block mt24" href="/signin">Return to sign in</Link>
      </div>
    );

  return (
    <div className="card">
      <h2>Reset your password</h2>
      <p className="sub">We will email you a link to choose a new password.</p>
      {error && <div className="alert alert-err mt16" role="alert">{error}</div>}
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            await api("/api/auth/forgot", { method: "POST", json: { email } });
            setSent(true);
          } catch (x) {
            setError((x as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="field">
          <label htmlFor="em">Email address</label>
          <input id="em" className="input" type="email" autoComplete="email" inputMode="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? "Sending…" : "Send reset link"}</button>
      </form>
      <Link className="btn btn-ghost btn-block mt16" href="/signin">Return to sign in</Link>
    </div>
  );
}
