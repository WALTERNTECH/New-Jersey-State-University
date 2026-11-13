"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  allSteps,
  completion,
  documentKinds,
  fieldError,
  sectionState,
  stepErrors,
  steps,
  wordCount,
  type Data,
  type Field,
  type Step,
} from "@/lib/form";
import { programme } from "@/lib/content";
import { api } from "@/lib/client";
import Documents, { type Doc } from "@/components/Documents";
import PhoneInput from "@/components/PhoneInput";
import { CheckIcon } from "@/components/Icons";

type Save = "saved" | "saving" | "error";
const stateLabel = { complete: "Completed", started: "In progress", empty: "Not started" } as const;

function FieldInput({ f, value, error, onChange, onBlur, defaultCountry }: {
  f: Field;
  value: string;
  error?: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  defaultCountry?: string;
}) {
  const id = `f_${f.name}`;
  const errId = error ? `${id}_err` : undefined;
  const label = (
    <>
      {f.label}
      {!f.required && <span className="fa-opt"> (optional)</span>}
    </>
  );

  if (f.type === "yesno") {
    return (
      <fieldset className={`fa-group${f.half ? " half" : ""}${error ? " err" : ""}`} aria-describedby={errId}>
        <legend className="fa-label">{label}</legend>
        {error && <span className="fa-error" id={errId}>{error}</span>}
        <div className="fa-radios">
          {["Yes", "No"].map((o) => (
            <label key={o} className="fa-radio">
              <input
                type="radio"
                name={f.name}
                id={o === "Yes" ? id : undefined}
                checked={value === o}
                onChange={() => {
                  onChange(o);
                  onBlur();
                }}
              />
              <span>{o}</span>
            </label>
          ))}
        </div>
      </fieldset>
    );
  }

  let control: React.ReactNode;
  const common = { id, name: f.name, "aria-invalid": !!error, "aria-describedby": errId, onBlur };
  if (f.type === "select") {
    control = (
      <select {...common} className="input" value={value} onChange={(e) => onChange(e.target.value)} autoComplete={f.autoComplete}>
        <option value="">- Select -</option>
        {f.options!.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    );
  } else if (f.type === "textarea") {
    const w = wordCount(value);
    control = (
      <>
        <textarea {...common} className="input" value={value} onChange={(e) => onChange(e.target.value)} rows={f.minWords ? 10 : 5} />
        <span className="fa-count" aria-live="polite">
          {w} {w === 1 ? "word" : "words"}
          {f.maxWords ? ` of ${f.maxWords}` : ""}
        </span>
      </>
    );
  } else if (f.type === "phone") {
    control = <PhoneInput id={id} value={value} onChange={onChange} onBlur={onBlur} invalid={!!error} defaultCountry={defaultCountry} describedBy={errId} />;
  } else {
    control = (
      <input
        {...common}
        className="input"
        type={f.type === "number" ? "text" : f.type}
        inputMode={f.type === "number" || f.digits ? "numeric" : f.type === "email" ? "email" : undefined}
        autoComplete={f.autoComplete ?? "off"}
        maxLength={f.maxLength ?? f.digits}
        value={value}
        onChange={(e) => onChange(f.type === "number" || f.digits ? e.target.value.replace(/[^\d]/g, "") : e.target.value)}
      />
    );
  }
  return (
    <div className={`fa-group${f.half ? " half" : ""}${error ? " err" : ""}`}>
      <label className="fa-label" htmlFor={id}>
        {label}
      </label>
      {error && (
        <span className="fa-error" id={errId}>
          {error}
        </span>
      )}
      {control}
    </div>
  );
}

const maskAccount = (s: string | undefined) => (s ? `···· ${s.replace(/\s/g, "").slice(-4)}` : "");

export default function Wizard({ initial, initialPayment, initialDocs, email, reference, firstStep }: {
  initial: Data;
  initialPayment: Data;
  initialDocs: Doc[];
  email: string;
  reference: string;
  firstStep: string;
}) {
  const [data, setData] = useState<Data>(initial);
  const [pay, setPay] = useState<Data>(initialPayment);
  const [docs, setDocs] = useState<Doc[]>(initialDocs);
  const [stepId, setStepId] = useState(allSteps.some((s) => s.id === firstStep) ? firstStep : "personal");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showAll, setShowAll] = useState<Record<string, boolean>>({});
  const [save, setSave] = useState<Save>("saved");
  const [saveError, setSaveError] = useState("");
  const [decl, setDecl] = useState({ accurate: false, consent: false });
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fromReview, setFromReview] = useState(false);
  const pending = useRef<{ app: Data; pay: Data }>({ app: {}, pay: {} });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const top = useRef<HTMLDivElement>(null);

  const flush = useCallback(async (keepalive = false) => {
    if (timer.current) clearTimeout(timer.current);
    const { app, pay: payPatch } = pending.current;
    if (!Object.keys(app).length && !Object.keys(payPatch).length) return;
    pending.current = { app: {}, pay: {} };
    setSave("saving");
    const send = (url: string, method: string, body: Data) =>
      keepalive
        ? fetch(url, { method, keepalive: true, headers: { "x-njsu": "1", "content-type": "application/json" }, body: JSON.stringify({ data: body }) })
        : api(url, { method, json: { data: body } });
    try {
      if (Object.keys(app).length) await send("/api/application", "PATCH", app);
      if (Object.keys(payPatch).length) await send("/api/application/payment", "PUT", payPatch);
      if (keepalive) return;
      const left = pending.current;
      setSave(Object.keys(left.app).length || Object.keys(left.pay).length ? "saving" : "saved");
      setSaveError("");
    } catch (e) {
      pending.current = { app: { ...app, ...pending.current.app }, pay: { ...payPatch, ...pending.current.pay } };
      setSave("error");
      setSaveError((e as Error).message);
      const st = (e as { status?: number }).status;
      if (st !== 401 && st !== 409) timer.current = setTimeout(() => flush(), 4000);
    }
  }, []);

  useEffect(() => {
    const onHide = () => document.visibilityState === "hidden" && flush(true);
    const onUnload = (e: BeforeUnloadEvent) => {
      const p = pending.current;
      if (Object.keys(p.app).length || Object.keys(p.pay).length) {
        flush(true);
        e.preventDefault();
      }
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("beforeunload", onUnload);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("beforeunload", onUnload);
    };
  }, [flush]);

  const update = (step: Step, name: string, value: string) => {
    if (step.secure) {
      setPay((d) => ({ ...d, [name]: value }));
      pending.current.pay[name] = value;
    } else {
      setData((d) => ({ ...d, [name]: value }));
      pending.current.app[name] = value;
    }
    setSave("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => flush(), 700);
  };

  const go = (id: string, editing = false) => {
    flush();
    setFromReview(editing);
    setStepId(id);
    const url = new URL(window.location.href);
    url.searchParams.set("step", id);
    window.history.replaceState(null, "", url);
    requestAnimationFrame(() => top.current?.scrollIntoView({ block: "start" }));
  };

  const dataFor = (s: Step) => (s.secure ? pay : data);
  const idx = allSteps.findIndex((s) => s.id === stepId);
  const step = steps.find((s) => s.id === stepId);
  const missingDocs = documentKinds.filter((k) => k.required && !docs.some((d) => d.kind === k.kind));
  const states = useMemo(() => {
    const m: Record<string, "complete" | "started" | "empty"> = {};
    for (const s of steps) m[s.id] = sectionState(s, s.secure ? pay : data);
    m.documents = missingDocs.length === 0 ? "complete" : docs.length ? "started" : "empty";
    return m;
  }, [data, pay, docs.length, missingDocs.length]);
  const { percent } = completion(data, pay, docs);
  const ready = Object.entries(states).every(([, v]) => v === "complete");
  const errorsHere = step ? stepErrors(step, dataFor(step)) : {};
  const showErrors = step ? !!showAll[step.id] : false;

  const next = () => {
    if (step && Object.keys(errorsHere).length && !showAll[step.id]) {
      setShowAll((s) => ({ ...s, [step.id]: true }));
      requestAnimationFrame(() => document.getElementById("fa-errors")?.focus());
      return;
    }
    go(fromReview ? "review" : allSteps[idx + 1].id);
  };

  async function submit() {
    setSubmitError("");
    setSubmitting(true);
    try {
      await flush();
      await api("/api/application/submit", { method: "POST", json: decl });
      window.location.href = "/portal/submitted";
    } catch (e) {
      setSubmitError((e as Error).message);
      setSubmitting(false);
    }
  }

  const saveLabel = save === "saving" ? "Saving" : save === "error" ? "Not saved" : "All changes saved";
  const title = allSteps[idx]?.title ?? "";

  return (
    <div className="fa" ref={top}>
      <div className="fa-head">
        <div className="wrap fa-head-in">
          <div>
            <p className="fa-kicker">
              {programme.name} application · {programme.cycle}
            </p>
            <h1 className="fa-h1">{title}</h1>
          </div>
          <div className="fa-pct" aria-live="polite">
            <b>{percent}%</b>
            <span>complete</span>
          </div>
        </div>
        <div className="wrap">
          <div className="fa-bar" role="progressbar" aria-label="Application progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
            <i style={{ width: `${percent}%` }} />
          </div>
        </div>
      </div>

      <div className="wrap fa-body">
        <nav className="fa-nav" aria-label="Application sections">
          <h2>Sections</h2>
          <ol>
            {allSteps.map((s, i) => {
              const st = s.id === "review" ? (ready ? "started" : "empty") : states[s.id];
              return (
                <li key={s.id}>
                  <button className={`fa-sec ${st}`} aria-current={s.id === stepId ? "step" : undefined} onClick={() => go(s.id)}>
                    <span className="fa-num">{st === "complete" && s.id !== stepId ? <CheckIcon /> : i + 1}</span>
                    <span className="fa-sec-t">
                      {s.title}
                      {s.id !== "review" && <small>{stateLabel[st]}</small>}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
          <dl className="fa-meta">
            <dt>Status</dt>
            <dd className={`fa-save ${save}`} aria-live="polite">{saveLabel}</dd>
            <dt>Reference</dt>
            <dd className="mono">{reference}</dd>
          </dl>
        </nav>

        <div className="fa-main">
          <label className="fa-jump">
            <span className="sr-only">Go to section</span>
            <select className="input" value={stepId} onChange={(e) => go(e.target.value)}>
              {allSteps.map((s, i) => (
                <option key={s.id} value={s.id}>
                  Section {i + 1} of {allSteps.length}: {s.title}
                </option>
              ))}
            </select>
          </label>

          {save === "error" && saveError && (
            <div className="alert alert-err" role="alert">
              <span>
                {saveError}
                {saveError.includes("Sign in") && (
                  <>
                    {" "}
                    <Link href="/signin">Sign in</Link>
                  </>
                )}
              </span>
            </div>
          )}

          {step && showErrors && Object.keys(errorsHere).length > 0 && (
            <div className="alert alert-err fa-summary" id="fa-errors" tabIndex={-1} role="alert">
              <div>
                <b>
                  {Object.keys(errorsHere).length} {Object.keys(errorsHere).length === 1 ? "answer needs" : "answers need"} attention
                </b>
                <ul>
                  {step.fields
                    .filter((f) => errorsHere[f.name])
                    .map((f) => (
                      <li key={f.name}>
                        <a href={`#f_${f.name}`}>{f.label}</a>: {errorsHere[f.name]}
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          )}

          {step && (
            <section className="fa-card" aria-labelledby="fa-title">
              <p className="fa-step">
                Section {idx + 1} of {allSteps.length}
              </p>
              <h2 id="fa-title">{step.title}</h2>
              <div className="fa-fields">
                {step.fields
                  .filter((f) => !f.showIf || f.showIf(dataFor(step)))
                  .map((f) => {
                    const err = touched[f.name] || showErrors ? fieldError(f, dataFor(step)) : null;
                    return (
                      <FieldInput
                        key={f.name}
                        f={f}
                        value={dataFor(step)[f.name] ?? ""}
                        error={err ?? undefined}
                        defaultCountry={data.residence}
                        onChange={(v) => update(step, f.name, v)}
                        onBlur={() => setTouched((t) => ({ ...t, [f.name]: true }))}
                      />
                    );
                  })}
                {step.id === "contact" && (
                  <div className="fa-group">
                    <span className="fa-label">Email address</span>
                    <span className="fa-static">{email}</span>
                  </div>
                )}
              </div>
            </section>
          )}

          {stepId === "documents" && (
            <section className="fa-card" aria-labelledby="fa-title">
              <p className="fa-step">
                Section {idx + 1} of {allSteps.length}
              </p>
              <h2 id="fa-title">Documents</h2>
              <Documents docs={docs} onChange={setDocs} />
            </section>
          )}

          {stepId === "review" && (
            <section className="fa-card" aria-labelledby="fa-title">
              <p className="fa-step">
                Section {idx + 1} of {allSteps.length}
              </p>
              <h2 id="fa-title">Review, sign and submit</h2>
              <div className="review">
                {steps.map((s) => {
                  const d = dataFor(s);
                  const errs = stepErrors(s, d);
                  return (
                    <section key={s.id}>
                      <header>
                        <h3>
                          {s.title}
                          <span className={`fa-tag ${states[s.id]}`}>{stateLabel[states[s.id]]}</span>
                        </h3>
                        <button className="btn btn-outline btn-sm" onClick={() => go(s.id, true)} aria-label={`Edit ${s.title}`}>
                          Edit
                        </button>
                      </header>
                      <dl>
                        {s.fields
                          .filter((f) => !f.showIf || f.showIf(d))
                          .filter((f) => f.required || d[f.name])
                          .map((f) => (
                            <div key={f.name} style={{ display: "contents" }}>
                              <dt>{f.label}</dt>
                              <dd className={errs[f.name] ? "missing" : ""}>
                                {errs[f.name] ? (d[f.name] ? `${f.name === "account_number" ? maskAccount(d[f.name]) : d[f.name].slice(0, 120)} (${errs[f.name]})` : "Not answered") : f.name === "account_number" ? maskAccount(d[f.name]) : d[f.name]}
                              </dd>
                            </div>
                          ))}
                      </dl>
                    </section>
                  );
                })}
                <section>
                  <header>
                    <h3>
                      Documents
                      <span className={`fa-tag ${states.documents}`}>{stateLabel[states.documents]}</span>
                    </h3>
                    <button className="btn btn-outline btn-sm" onClick={() => go("documents", true)} aria-label="Edit Documents">
                      Edit
                    </button>
                  </header>
                  <dl>
                    {documentKinds.map((k) => {
                      const d = docs.find((x) => x.kind === k.kind);
                      return (
                        <div key={k.kind} style={{ display: "contents" }}>
                          <dt>{k.label}</dt>
                          <dd className={!d && k.required ? "missing" : ""}>{d ? d.filename : k.required ? "Not uploaded" : "Not provided"}</dd>
                        </div>
                      );
                    })}
                  </dl>
                </section>
              </div>

              <fieldset className="fa-sign">
                <legend>Declaration</legend>
                <label className="check">
                  <input type="checkbox" checked={decl.accurate} onChange={(e) => setDecl((d) => ({ ...d, accurate: e.target.checked }))} />
                  <span>The information in this application is true and complete, and the statements are my own work.</span>
                </label>
                <label className="check">
                  <input type="checkbox" checked={decl.consent} onChange={(e) => setDecl((d) => ({ ...d, consent: e.target.checked }))} />
                  <span>The scholarship office may verify my documents with the issuing schools and authorities.</span>
                </label>
              </fieldset>
              {!ready && (
                <div className="alert alert-info" role="status">
                  <span>
                    To submit, complete:{" "}
                    {allSteps
                      .filter((s) => s.id !== "review" && states[s.id] !== "complete")
                      .map((s, i, a) => (
                        <span key={s.id}>
                          <button className="textlink" onClick={() => go(s.id)}>
                            {s.title}
                          </button>
                          {i < a.length - 1 ? ", " : ""}
                        </span>
                      ))}
                  </span>
                </div>
              )}
              {submitError && (
                <div className="alert alert-err" role="alert">
                  {submitError}
                </div>
              )}
            </section>
          )}

          <div className="fa-actions">
            {idx > 0 ? (
              <button className="btn btn-outline" onClick={() => go(allSteps[idx - 1].id)}>
                Previous
              </button>
            ) : (
              <Link className="btn btn-outline" href="/portal">
                Dashboard
              </Link>
            )}
            {stepId === "review" ? (
              <button className="btn btn-primary" disabled={!ready || !decl.accurate || !decl.consent || submitting} onClick={submit}>
                {submitting ? "Submitting" : "Submit application"}
              </button>
            ) : (
              <button className="btn btn-primary" onClick={next}>
                {fromReview ? "Save and return to review" : "Save and continue"}
              </button>
            )}
          </div>
          {step && showErrors && Object.keys(errorsHere).length > 0 && (
            <p className="fa-skip">
              <button className="textlink" onClick={() => go(fromReview ? "review" : allSteps[idx + 1].id)}>
                Continue without finishing this section
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
