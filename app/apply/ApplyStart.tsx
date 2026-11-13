"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/client";
import { isEmail } from "@/lib/form";
import { countryList } from "@/lib/content";

type Answer = "yes" | "no" | "soon";
type Key = "country" | "school" | "need" | "degree" | "age";

const questions: { key: Key; text: string; options: { v: Answer; label: string }[]; pass: Answer[]; why: string }[] = [
  {
    key: "country",
    text: `Are you a citizen or resident of ${countryList.replace(" and ", " or ")}?`,
    options: [
      { v: "yes", label: "Yes" },
      { v: "no", label: "No" },
    ],
    pass: ["yes"],
    why: `The Access Scholarship is open only to citizens and residents of ${countryList}.`,
  },
  {
    key: "school",
    text: "Have you completed secondary school?",
    options: [
      { v: "yes", label: "Yes" },
      { v: "soon", label: "I will complete it this year" },
      { v: "no", label: "No" },
    ],
    pass: ["yes", "soon"],
    why: "Candidates must have completed secondary school, or expect to complete it before the academic year begins.",
  },
  {
    key: "need",
    text: "Would your family require financial support for you to attend university?",
    options: [
      { v: "yes", label: "Yes" },
      { v: "no", label: "No" },
    ],
    pass: ["yes"],
    why: "The Access Scholarship is reserved for students whose families are unable to meet the cost of a university education.",
  },
  {
    key: "degree",
    text: "Do you already hold a bachelor’s degree?",
    options: [
      { v: "no", label: "No" },
      { v: "yes", label: "Yes" },
    ],
    pass: ["no"],
    why: "The scholarship supports study toward a first bachelor’s degree only.",
  },
  {
    key: "age",
    text: "Will you be at least 16 years of age when the academic year begins?",
    options: [
      { v: "yes", label: "Yes" },
      { v: "no", label: "No" },
    ],
    pass: ["yes"],
    why: "Scholars must be at least 16 years of age at matriculation.",
  },
];

export default function ApplyStart() {
  const [answers, setAnswers] = useState<Partial<Record<Key, Answer>>>({});
  const [stage, setStage] = useState<"check" | "account">("check");
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", password: "" });
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [consent, setConsent] = useState(false);

  const answered = questions.every((q) => answers[q.key]);
  const failed = questions.filter((q) => answers[q.key] && !q.pass.includes(answers[q.key]!));

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (errors[k]) setErrors((x) => ({ ...x, [k]: "" }));
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.first_name.trim()) errs.first_name = "Enter your first name";
    if (!form.last_name.trim()) errs.last_name = "Enter your last name";
    if (!isEmail(form.email.trim())) errs.email = "Enter a valid email address";
    if (form.password.length < 8) errs.password = "Use at least 8 characters";
    if (!consent) errs.consent = "Please confirm that you understand how your information is used";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    setError("");
    try {
      await api("/api/auth/register", { method: "POST", json: { ...form, eligibility: answers } });
      window.location.href = "/portal/application";
    } catch (err) {
      const x = err as Error & { data?: { field?: string } };
      if (x.data?.field && typeof x.data.field === "string") setErrors({ [x.data.field]: x.message });
      else setError(x.message);
      setBusy(false);
    }
  }

  if (stage === "check") {
    return (
      <div className="card">
        <p className="stepper">Step 1 of 2</p>
        <h2>Eligibility</h2>
        <div className="mt24">
          {questions.map((q) => (
            <div className="q" key={q.key} role="group" aria-label={q.text}>
              <p>{q.text}</p>
              <div className="choice">
                {q.options.map((o) => (
                  <button key={o.v} type="button" aria-pressed={answers[q.key] === o.v} onClick={() => setAnswers((a) => ({ ...a, [q.key]: o.v }))}>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        {failed.length > 0 ? (
          <div className="alert alert-info mt24" role="status">
            <div>
              <b>You are not eligible for the Access Scholarship.</b>
              <ul>
                {failed.map((q) => (
                  <li key={q.key}>{q.why}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <button className="btn btn-primary btn-block mt24" disabled={!answered} onClick={() => setStage("account")}>
            {answered ? "Continue" : "Answer every question to continue"}
          </button>
        )}
        <p className="small center mt16">
          <Link href="/signin">Sign in to an existing application</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <p className="stepper">Step 2 of 2</p>
      <h2>Create your account</h2>
      {error && (
        <div className="alert alert-err mt16" role="alert">
          {error}
        </div>
      )}
      <form onSubmit={submit} noValidate>
        <div className="row2">
          <div className="field">
            <label htmlFor="fn">First name</label>
            <input id="fn" className="input" autoComplete="given-name" value={form.first_name} onChange={set("first_name")} aria-invalid={!!errors.first_name} />
            {errors.first_name && <span className="error">{errors.first_name}</span>}
          </div>
          <div className="field">
            <label htmlFor="ln">Last name</label>
            <input id="ln" className="input" autoComplete="family-name" value={form.last_name} onChange={set("last_name")} aria-invalid={!!errors.last_name} />
            {errors.last_name && <span className="error">{errors.last_name}</span>}
          </div>
        </div>
        <div className="field">
          <label htmlFor="em">Email address</label>
          <input id="em" className="input" type="email" autoComplete="email" inputMode="email" value={form.email} onChange={set("email")} aria-invalid={!!errors.email} />
          {errors.email && (
            <span className="error">
              {errors.email}
              {errors.email.includes("already") && (
                <>
                  {" "}
                  <Link href="/signin">Sign in</Link>
                </>
              )}
            </span>
          )}
        </div>
        <div className="field">
          <label htmlFor="pw">Password</label>
          <div className="pw">
            <input
              id="pw"
              className="input"
              type={show ? "text" : "password"}
              autoComplete="new-password"
              value={form.password}
              onChange={set("password")}
              aria-invalid={!!errors.password}
            />
            <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? "Hide password" : "Show password"}>
              {show ? "Hide" : "Show"}
            </button>
          </div>
          {errors.password && <span className="error">{errors.password}</span>}
        </div>
        <label className="check small">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          <span>I agree that New Jersey State University may use this information to assess my application and administer my award.</span>
        </label>
        {errors.consent && <span className="error">{errors.consent}</span>}
        <button className="btn btn-primary btn-block" disabled={busy}>
          {busy ? "Creating your account" : "Create account"}
        </button>
        <button type="button" className="textlink small" onClick={() => setStage("check")} style={{ justifySelf: "center" }}>
          Back to eligibility
        </button>
      </form>
    </div>
  );
}
