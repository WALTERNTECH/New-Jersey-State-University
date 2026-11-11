"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { allSteps, documentKinds, fieldError, stepErrors, steps, wordCount, type Data, type Field } from "@/lib/form";
import { api } from "@/lib/client";
import Documents, { type Doc } from "@/components/Documents";

type Save = "saved" | "saving" | "error";

function FieldInput({ f, value, error, onChange, onBlur }: { f: Field; value: string; error?: string; onChange: (v: string) => void; onBlur: () => void }) {
  const id = `f_${f.name}`;
  const describedBy = [f.hint ? `${id}_hint` : "", error ? `${id}_err` : ""].filter(Boolean).join(" ") || undefined;
  const common = { id, name: f.name, "aria-invalid": !!error, "aria-describedby": describedBy, onBlur };
  let control: React.ReactNode;
  if (f.type === "select") {
    control = (
      <select {...common} className="input" value={value} onChange={(e) => onChange(e.target.value)} autoComplete={f.autoComplete}>
        <option value="">Choose…</option>
        {f.options!.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    );
  } else if (f.type === "textarea") {
    const w = wordCount(value);
    const bad = (f.maxWords && w > f.maxWords) || false;
    const good = f.minWords ? w >= f.minWords && !bad : false;
    control = (
      <>
        <textarea {...common} className="input" value={value} onChange={(e) => onChange(e.target.value)} rows={f.minWords ? 9 : 5} />
        <span className={`counter${bad ? " bad" : good ? " good" : ""}`} aria-live="polite">
          {w} {w === 1 ? "word" : "words"}
          {f.minWords ? ` · ${f.minWords}–${f.maxWords}` : f.maxWords ? ` · up to ${f.maxWords}` : ""}
        </span>
      </>
    );
  } else if (f.type === "yesno") {
    control = (
      <div className="segmented" role="group" aria-labelledby={`${id}_lbl`}>
        {["Yes", "No"].map((o) => (
          <button
            key={o}
            type="button"
            aria-pressed={value === o}
            onClick={() => {
              onChange(o);
              onBlur();
            }}
          >
            {o}
          </button>
        ))}
      </div>
    );
  } else {
    control = (
      <input
        {...common}
        className="input"
        type={f.type === "number" ? "text" : f.type}
        inputMode={f.type === "number" ? "numeric" : f.type === "tel" ? "tel" : f.type === "email" ? "email" : undefined}
        autoComplete={f.autoComplete ?? "off"}
        placeholder={f.placeholder}
        maxLength={f.maxLength}
        value={value}
        onChange={(e) => onChange(f.type === "number" ? e.target.value.replace(/[^\d]/g, "") : e.target.value)}
      />
    );
  }
  return (
    <div className={`field${f.half ? "" : " full"}`}>
      {f.type === "yesno" ? (
        <span className="label" id={`${id}_lbl`}>
          {f.label}
          {!f.required && <span className="opt">Optional</span>}
        </span>
      ) : (
        <label htmlFor={id}>
          {f.label}
          {!f.required && <span className="opt">Optional</span>}
        </label>
      )}
      {control}
      {f.hint && f.type !== "textarea" && !error && (
        <span className="hint" id={`${id}_hint`}>
          {f.hint}
        </span>
      )}
      {error && (
        <span className="error" id={`${id}_err`}>
          {error}
        </span>
      )}
    </div>
  );
}

export default function Wizard({ initial, initialDocs, email, reference, firstStep }: {
  initial: Data;
  initialDocs: Doc[];
  email: string;
  reference: string;
  firstStep: string;
}) {
  const [data, setData] = useState<Data>(initial);
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
  const pending = useRef<Data>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const top = useRef<HTMLDivElement>(null);

  const flush = useCallback(async (keepalive = false) => {
    if (timer.current) clearTimeout(timer.current);
    const patch = pending.current;
    if (!Object.keys(patch).length) return;
    pending.current = {};
    setSave("saving");
    try {
      if (keepalive) {
        fetch("/api/application", { method: "PATCH", keepalive: true, headers: { "x-njsu": "1", "content-type": "application/json" }, body: JSON.stringify({ data: patch }) });
        return;
      }
      await api("/api/application", { method: "PATCH", json: { data: patch } });
      setSave(Object.keys(pending.current).length ? "saving" : "saved");
      setSaveError("");
    } catch (e) {
      pending.current = { ...patch, ...pending.current };
      setSave("error");
      setSaveError((e as Error).message);
      if ((e as { status?: number }).status !== 401 && (e as { status?: number }).status !== 409) {
        timer.current = setTimeout(() => flush(), 4000);
      }
    }
  }, []);

  useEffect(() => {
    const onHide = () => document.visibilityState === "hidden" && flush(true);
    const onUnload = (e: BeforeUnloadEvent) => {
      if (Object.keys(pending.current).length) {
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

  const update = (name: string, value: string) => {
    setData((d) => ({ ...d, [name]: value }));
    pending.current[name] = value;
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
    requestAnimationFrame(() => top.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const idx = allSteps.findIndex((s) => s.id === stepId);
  const step = steps.find((s) => s.id === stepId);
  const missingDocs = documentKinds.filter((k) => k.required && !docs.some((d) => d.kind === k.kind));
  const status = useMemo(() => {
    const m: Record<string, boolean> = {};
    for (const s of steps) m[s.id] = Object.keys(stepErrors(s, data)).length === 0;
    m.documents = missingDocs.length === 0;
    return m;
  }, [data, missingDocs.length]);
  const doneCount = Object.values(status).filter(Boolean).length;
  const total = steps.length + 1;
  const ready = doneCount === total;

  const next = () => {
    if (step) {
      const errs = stepErrors(step, data);
      if (Object.keys(errs).length && !showAll[step.id]) {
        setShowAll((s) => ({ ...s, [step.id]: true }));
        requestAnimationFrame(() => document.getElementById(`f_${Object.keys(errs)[0]}`)?.focus());
        return;
      }
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

  const saveLabel = save === "saving" ? "Saving…" : save === "error" ? "Not saved — retrying" : "All changes saved";

  return (
    <>
      <div className="mobilesteps">
        <div className="wrap">
          <div className="top">
            <span>
              Step {idx + 1} of {allSteps.length} · {allSteps[idx].short}
            </span>
            <span className={`savestate ${save}`}>
              <i /> {save === "saved" ? "Saved" : save === "saving" ? "Saving" : "Not saved"}
            </span>
          </div>
          <div className="bar">
            <i style={{ width: `${((idx + 1) / allSteps.length) * 100}%` }} />
          </div>
        </div>
      </div>
      <div className="wrap wizard" ref={top} style={{ scrollMarginTop: 120 }}>
        <nav className="rail" aria-label="Application sections">
          <ol>
            {allSteps.map((s, i) => (
              <li key={s.id}>
                <button aria-current={s.id === stepId ? "step" : undefined} onClick={() => go(s.id)}>
                  <span className={`circ${status[s.id] && s.id !== stepId ? " done" : ""}`}>{status[s.id] && s.id !== stepId ? "✓" : i + 1}</span>
                  {s.short}
                </button>
              </li>
            ))}
          </ol>
          <div className="meta">
            <div className={`savestate ${save}`} aria-live="polite">
              <i /> {saveLabel}
            </div>
            <div className="bar mt16">
              <i style={{ width: `${(doneCount / total) * 100}%` }} />
            </div>
            <p className="mt8">
              {doneCount} of {total} sections complete
            </p>
            <p className="mt8">
              Reference <span className="ref" style={{ padding: "4px 6px", fontSize: 12 }}>{reference}</span>
            </p>
          </div>
        </nav>

        <div>
          {save === "error" && saveError && (
            <div className="alert alert-err" role="alert" style={{ marginBottom: 20 }}>
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

          {step && (
            <section aria-labelledby="steptitle">
              <div className="stephead">
                <span className="count">
                  Section {idx + 1} of {allSteps.length}
                </span>
                <h2 id="steptitle">{step.title}</h2>
                <p>{step.intro}</p>
              </div>
              <div className="formgrid">
                {step.fields
                  .filter((f) => !f.showIf || f.showIf(data))
                  .map((f) => {
                    const err = touched[f.name] || showAll[step.id] ? fieldError(f, data) : null;
                    return (
                      <FieldInput
                        key={f.name}
                        f={f}
                        value={data[f.name] ?? ""}
                        error={err ?? undefined}
                        onChange={(v) => update(f.name, v)}
                        onBlur={() => setTouched((t) => ({ ...t, [f.name]: true }))}
                      />
                    );
                  })}
                {step.id === "contact" && (
                  <div className="field full">
                    <span className="label">Email</span>
                    <span className="hint">
                      {email} · This is the email on your account, and where we send your decision.
                    </span>
                  </div>
                )}
              </div>
            </section>
          )}

          {stepId === "documents" && (
            <section aria-labelledby="steptitle">
              <div className="stephead">
                <span className="count">
                  Section {idx + 1} of {allSteps.length}
                </span>
                <h2 id="steptitle">Documents</h2>
                <p>Two documents are needed to submit. The optional ones strengthen your application and can be added up to 14 days after you submit.</p>
              </div>
              <Documents docs={docs} onChange={setDocs} />
            </section>
          )}

          {stepId === "review" && (
            <section aria-labelledby="steptitle">
              <div className="stephead">
                <span className="count">Final step</span>
                <h2 id="steptitle">Review and submit</h2>
                <p>Check your answers. Select Edit on any section to change it; you will come straight back here.</p>
              </div>
              <div className="review">
                {steps.map((s) => {
                  const errs = stepErrors(s, data);
                  return (
                    <section key={s.id}>
                      <header>
                        <h3>
                          <span className={`circ${status[s.id] ? " done" : ""}`}>{status[s.id] ? "✓" : "!"}</span>
                          {s.title}
                        </h3>
                        <button className="btn btn-ghost btn-sm" onClick={() => go(s.id, true)} aria-label={`Edit ${s.title}`}>
                          Edit
                        </button>
                      </header>
                      <dl>
                        {s.fields
                          .filter((f) => !f.showIf || f.showIf(data))
                          .filter((f) => f.required || data[f.name])
                          .map((f) => (
                            <div key={f.name} style={{ display: "contents" }}>
                              <dt>{f.label}</dt>
                              <dd className={errs[f.name] ? "missing" : ""}>
                                {errs[f.name] ? (data[f.name] ? `${data[f.name].slice(0, 120)} — ${errs[f.name]}` : "Not answered yet") : data[f.name]}
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
                      <span className={`circ${status.documents ? " done" : ""}`}>{status.documents ? "✓" : "!"}</span>
                      Documents
                    </h3>
                    <button className="btn btn-ghost btn-sm" onClick={() => go("documents", true)} aria-label="Edit Documents">
                      Edit
                    </button>
                  </header>
                  <dl>
                    {documentKinds.map((k) => {
                      const d = docs.find((x) => x.kind === k.kind);
                      return (
                        <div key={k.kind} style={{ display: "contents" }}>
                          <dt>{k.label}</dt>
                          <dd className={!d && k.required ? "missing" : ""}>{d ? d.filename : k.required ? "Not uploaded yet" : "Not provided — you can add it after submitting"}</dd>
                        </div>
                      );
                    })}
                  </dl>
                </section>
              </div>

              <div className="panel mt32">
                <div className="panel-b stack">
                  <h3 style={{ fontSize: 20 }}>Declaration</h3>
                  <label className="check">
                    <input type="checkbox" checked={decl.accurate} onChange={(e) => setDecl((d) => ({ ...d, accurate: e.target.checked }))} />
                    <span>The information in this application is true and complete, and the essays are my own work.</span>
                  </label>
                  <label className="check">
                    <input type="checkbox" checked={decl.consent} onChange={(e) => setDecl((d) => ({ ...d, consent: e.target.checked }))} />
                    <span>I agree that the scholarship office may verify my documents with the issuing schools and authorities.</span>
                  </label>
                  {!ready && (
                    <div className="alert alert-info" role="status">
                      <span>
                        Finish the sections marked <b>!</b> above before you submit:{" "}
                        {allSteps
                          .filter((s) => s.id !== "review" && !status[s.id])
                          .map((s, i, a) => (
                            <span key={s.id}>
                              <button className="textlink" onClick={() => go(s.id)}>
                                {s.short}
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
                  <div className="flex">
                    <button className="btn btn-primary" disabled={!ready || !decl.accurate || !decl.consent || submitting} onClick={submit}>
                      {submitting ? "Submitting…" : "Submit application"}
                    </button>
                    <span className="small muted">You can still add optional documents after submitting.</span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {stepId !== "review" && (
            <div className="navrow">
              {idx > 0 ? (
                <button className="btn btn-ghost" onClick={() => go(allSteps[idx - 1].id)}>
                  Back
                </button>
              ) : (
                <Link className="btn btn-ghost" href="/portal">
                  Dashboard
                </Link>
              )}
              <button className="btn btn-primary" onClick={next}>
                {fromReview ? "Save and return to review" : allSteps[idx + 1].id === "review" ? "Save and review" : "Save and continue"}
              </button>
            </div>
          )}
          {step && showAll[step.id] && Object.keys(stepErrors(step, data)).length > 0 && (
            <p className="small muted mt16" style={{ textAlign: "right" }}>
              Some answers still need attention. You can{" "}
              <button className="textlink" onClick={() => go(allSteps[idx + 1].id)}>
                skip ahead for now
              </button>{" "}
              and come back later.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
