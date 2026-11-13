"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, fmtSize } from "@/lib/client";
import { shrink } from "@/components/Documents";
import type { AllowanceField } from "@/lib/content";

type DocSpec = { key: string; label: string; hint?: string; required: boolean };
const MAX = 4 * 1024 * 1024;

export default function AllowanceForm({ slug, fields, documents, initial, existingFiles }: {
  slug: string;
  fields: AllowanceField[];
  documents: DocSpec[];
  initial: Record<string, string>;
  existingFiles: { doc_key: string; filename: string }[];
}) {
  const router = useRouter();
  const [data, setData] = useState<Record<string, string>>(initial);
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [stage, setStage] = useState("");
  const [done, setDone] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const uploaded = new Map(existingFiles.map((f) => [f.doc_key, f.filename]));

  function validate() {
    const e: Record<string, string> = {};
    for (const f of fields) {
      const v = (data[f.name] ?? "").trim();
      if (f.required && !v) e[f.name] = "This is required";
      else if (v && f.type === "number" && f.max !== undefined && Number(v) > f.max) e[f.name] = `The maximum is ${f.max.toLocaleString("en-US")}`;
    }
    for (const d of documents) if (d.required && !files[d.key] && !uploaded.has(d.key)) e[`doc_${d.key}`] = "Please attach this document";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    setError("");
    if (!validate()) return;
    try {
      setStage("Saving your answers…");
      const { id } = await api<{ id: string }>("/api/allowances", { method: "POST", json: { slug, data } });
      for (const d of documents) {
        const f = files[d.key];
        if (!f) continue;
        setStage(`Uploading ${d.label.toLowerCase()}…`);
        const small = await shrink(f);
        if (small.size > MAX) throw new Error(`${d.label} is larger than 4 MB. Please upload a smaller scan or a photograph.`);
        const fd = new FormData();
        fd.set("key", d.key);
        fd.set("file", small);
        await api(`/api/allowances/${id}/files`, { method: "POST", body: fd });
      }
      setStage("Submitting…");
      await api(`/api/allowances/${id}/submit`, { method: "POST" });
      setDone(true);
      router.refresh();
    } catch (e) {
      const x = e as Error & { data?: { errors?: Record<string, string> } };
      if (x.data?.errors) setErrors(x.data.errors);
      setError(x.message);
    } finally {
      setStage("");
    }
  }

  if (done) {
    return (
      <div className="alert alert-ok" role="status">
        <span>
          Your request has been submitted to the Office of Financial Aid. You will be notified in your portal once it has been reviewed.
        </span>
      </div>
    );
  }

  return (
    <form className="stack" onSubmit={submit} noValidate>
      <div className="formgrid">
        {fields.map((f) => {
          const id = `af_${f.name}`;
          const err = errors[f.name];
          const common = { id, "aria-invalid": !!err, value: data[f.name] ?? "", onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setData((d) => ({ ...d, [f.name]: e.target.value })) };
          return (
            <div className={`field${f.type === "textarea" || f.type === "text" ? " full" : ""}`} key={f.name}>
              <label htmlFor={id}>
                {f.label}
                {!f.required && <span className="opt">Optional</span>}
              </label>
              {f.type === "select" ? (
                <select className="input" {...common}>
                  <option value="">- Select -</option>
                  {f.options!.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              ) : f.type === "textarea" ? (
                <textarea className="input" style={{ minHeight: 120 }} {...common} />
              ) : (
                <input className="input" type={f.type === "number" ? "text" : f.type} inputMode={f.type === "number" ? "decimal" : undefined} {...common} />
              )}
              {err ? <span className="error">{err}</span> : f.hint ? <span className="hint">{f.hint}</span> : null}
            </div>
          );
        })}
      </div>

      {documents.length > 0 && (
        <div className="stack" style={{ gap: 12 }}>
          <h3 style={{ fontSize: 17, fontFamily: "var(--sans)", color: "var(--ink)" }}>Supporting documents</h3>
          {documents.map((d) => {
            const f = files[d.key];
            const prior = uploaded.get(d.key);
            const err = errors[`doc_${d.key}`];
            return (
              <div key={d.key} className={`doc${f || prior ? " has" : ""}`}>
                <div className="info">
                  <b>
                    {d.label}
                    <span className={`req${d.required ? " must" : ""}`}>{d.required ? "Required" : "Optional"}</span>
                  </b>
                  <span className="file">{f ? `${f.name} · ${fmtSize(f.size)}` : prior ? `${prior} (uploaded)` : d.hint}</span>
                  {err && <span className="error small">{err}</span>}
                </div>
                <div className="acts">
                  <label className={`btn btn-sm ${f || prior ? "btn-ghost" : "btn-primary"}`} style={{ cursor: "pointer" }}>
                    {f || prior ? "Replace" : "Choose file"}
                    <input
                      type="file"
                      hidden
                      accept=".pdf,.jpg,.jpeg,.png,image/*,application/pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null;
                        setFiles((x) => ({ ...x, [d.key]: file }));
                        setErrors((x) => ({ ...x, [`doc_${d.key}`]: "" }));
                      }}
                    />
                  </label>
                </div>
              </div>
            );
          })}
          <p className="small muted">PDF, JPG or PNG, up to 4 MB each.</p>
        </div>
      )}

      <label className="check">
        <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
        <span>I confirm that the information and documents in this request are accurate and my own.</span>
      </label>
      {error && <div className="alert alert-err" role="alert">{error}</div>}
      <div className="flex">
        <button className="btn btn-primary" disabled={!!stage || !confirmed}>{stage || "Submit request"}</button>
      </div>
    </form>
  );
}
