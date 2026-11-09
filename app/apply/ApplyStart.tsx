"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/client";
import { isEmail } from "@/lib/form";

type Answer = "yes" | "no" | "soon";
type Key = "school" | "need" | "degree" | "age";

const questions: { key: Key; text: string; options: { v: Answer; label: string }[]; pass: Answer[]; why: string }[] = [
  {
    key: "school",
    text: "Have you completed secondary or high school?",
    options: [
      { v: "yes", label: "Yes" },
      { v: "soon", label: "I finish this year" },
      { v: "no", label: "No" },
    ],
    pass: ["yes", "soon"],
    why: "You need to have finished secondary or high school, or be finishing it before the programme starts.",
  },
  {
    key: "need",
    text: "Would your family need financial support for you to attend university?",
    options: [
      { v: "yes", label: "Yes" },
      { v: "no", label: "No" },
    ],
    pass: ["yes"],
    why: "The Access Scholarship is reserved for students who could not attend university without it.",
  },
  {
    key: "degree",
    text: "Do you already hold a bachelor’s degree?",
    options: [
      { v: "no", label: "No" },
      { v: "yes", label: "Yes" },
    ],
    pass: ["no"],
    why: "The scholarship funds a first bachelor’s degree only.",
  },
  {
    key: "age",
    text: "Will you be 16 or older by August of the year you start?",
    options: [
      { v: "yes", label: "Yes" },
      { v: "no", label: "No" },
    ],
    pass: ["yes"],
    why: "Scholars need to be at least 16 when studies begin.",
  },
];

function strength(p: string) {
  let s = 0;
  if (p.length >= 8) s++;
  if (p.length >= 12) s++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
  if (/\d/.test(p) || /[^\w]/.test(p)) s++;
  return s;
}

export default function ApplyStart() {
  const [answers, setAnswers] = useState<Partial<Record<Key, Answer>>>({});
  const [stage, setStage] = useState<"check" | "account">("check");
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", password: "" });
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

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
        <div className="stepper">
          <i className="on" />
          <i />
          <span>Step 1 of 2 · Eligibility</span>
        </div>
        <h2>Do you qualify?</h2>
        <p className="sub">Four questions. Your answers are kept with your application.</p>
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
              <b>This scholarship may not be the right fit.</b>
              <ul style={{ margin: "8px 0 0", paddingLeft: 18 }}>
                {failed.map((q) => (
                  <li key={q.key}>{q.why}</li>
                ))}
              </ul>
              <p className="mt8">
                If your answer changes, you can come back at any time. <Link href="/#faq">Read the questions applicants ask</Link>.
              </p>
            </div>
          </div>
        ) : (
          <button className="btn btn-primary btn-block mt24" disabled={!answered} onClick={() => setStage("account")}>
            {answered ? "You qualify — continue" : "Answer all four to continue"}
          </button>
        )}
        <p className="small muted center mt16">
          Already started? <Link href="/signin">Sign in to continue</Link>
        </p>
      </div>
    );
  }

  const s = strength(form.password);
  return (
    <div className="card">
      <div className="stepper">
        <i className="on" />
        <i className="on" />
        <span>Step 2 of 2 · Your account</span>
      </div>
      <h2>Create your account</h2>
      <p className="sub">You will use this to continue your application and see your decision.</p>
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
          <label htmlFor="em">Email</label>
          <input id="em" className="input" type="email" autoComplete="email" inputMode="email" value={form.email} onChange={set("email")} aria-invalid={!!errors.email} />
          {errors.email ? (
            <span className="error">
              {errors.email}
              {errors.email.includes("already") && (
                <>
                  {" "}
                  <Link href="/signin">Sign in</Link>
                </>
              )}
            </span>
          ) : (
            <span className="hint">Use an address you check often. Decisions are sent here.</span>
          )}
        </div>
        <div className="field">
          <label htmlFor="pw">Create a password</label>
          <div className="pw">
            <input
              id="pw"
              className="input"
              type={show ? "text" : "password"}
              autoComplete="new-password"
              value={form.password}
              onChange={set("password")}
              aria-invalid={!!errors.password}
              aria-describedby="pwhint"
            />
            <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? "Hide password" : "Show password"}>
              {show ? "Hide" : "Show"}
            </button>
          </div>
          <div className="meter" aria-hidden>
            {[0, 1, 2, 3].map((i) => (
              <i key={i} className={i < s ? "on" : ""} />
            ))}
          </div>
          {errors.password ? <span className="error">{errors.password}</span> : <span className="hint" id="pwhint">At least 8 characters.</span>}
        </div>
        <button className="btn btn-primary btn-block" disabled={busy}>
          {busy ? "Creating your account…" : "Create account and start"}
        </button>
        <button type="button" className="textlink small" onClick={() => setStage("check")} style={{ justifySelf: "center" }}>
          Back to eligibility
        </button>
      </form>
    </div>
  );
}
