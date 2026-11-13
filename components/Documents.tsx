"use client";

import { useRef, useState } from "react";
import { documentKinds, enrolmentDocs, reviewLabels } from "@/lib/form";
import { api, fmtSize } from "@/lib/client";

export interface Doc {
  id: string;
  kind: string;
  filename: string;
  mime: string;
  size: number;
  created_at: string;
  review?: string;
  review_note?: string | null;
}

const MAX = 4 * 1024 * 1024;

/** Photos straight from a phone are often too large; shrink them in the browser before upload. */
export async function shrink(file: File): Promise<File> {
  if (!/^image\/(jpeg|png|webp|heic)/.test(file.type) || file.size <= MAX * 0.9) return file;
  const bmp = await createImageBitmap(file).catch(() => null);
  if (!bmp) return file;
  const scale = Math.min(1, 2400 / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.82));
  return blob ? new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" }) : file;
}

function Icon({ done }: { done: boolean }) {
  return done ? (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
      <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" strokeLinejoin="round" />
      <path d="M14 3v5h5M12 18v-6M9 14.5l3-3 3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Slot({ kind, label, required, doc, locked, reviewed, onChange }: {
  kind: string;
  label: string;
  required: boolean;
  doc?: Doc;
  locked: boolean;
  reviewed?: boolean;
  onChange: (d: Doc | null, kind: string) => void;
}) {
  const review = reviewed && doc ? doc.review ?? "pending" : null;
  const final = review === "verified";
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState("");

  async function upload(f: File | undefined) {
    if (!f) return;
    setError("");
    if (!/pdf|jpe?g|png|heic|webp/i.test(f.type + f.name)) return setError("Upload a PDF, JPG or PNG file.");
    setBusy(true);
    try {
      const file = await shrink(f);
      if (file.size > MAX) throw new Error("That file is over 4 MB. Try a smaller scan, or take a photo of the page instead.");
      const fd = new FormData();
      fd.set("kind", kind);
      fd.set("file", file);
      const r = await api<{ document: Doc }>("/api/documents", { method: "POST", body: fd });
      onChange(r.document, kind);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  async function remove() {
    if (!doc) return;
    setBusy(true);
    try {
      await api(`/api/documents/${doc.id}`, { method: "DELETE" });
      onChange(null, kind);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div
        className={`doc${doc && review !== "rejected" ? " has" : ""}${review === "rejected" ? " bad" : ""}${drag ? " drag" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          if (!final) setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          if (!final) upload(e.dataTransfer.files[0]);
        }}
      >
        <span className="ico">
          <Icon done={!!doc && review !== "rejected"} />
        </span>
        <div className="info">
          <b>
            {label}
            {review ? (
              <span className={`rv ${review}`}>{reviewLabels[review]}</span>
            ) : (
              <span className={`req${required ? " must" : ""}`}>{required ? "Required" : "Optional"}</span>
            )}
          </b>
          {doc ? (
            <span className="file">
              <a href={`/api/documents/${doc.id}`} target="_blank" rel="noopener">
                {doc.filename}
              </a>{" "}
              · {fmtSize(doc.size)}
            </span>
          ) : (
            <span className="file">Not uploaded</span>
          )}
          {review === "rejected" && doc?.review_note && <span className="rv-note">Please replace this file: {doc.review_note}</span>}
        </div>
        {!final && (
          <div className="acts">
            <input ref={input} type="file" accept=".pdf,.jpg,.jpeg,.png,image/*,application/pdf" hidden onChange={(e) => upload(e.target.files?.[0])} />
            {doc && !locked && (
              <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={remove}>
                Remove
              </button>
            )}
            <button type="button" className={`btn btn-sm ${doc && review !== "rejected" ? "btn-ghost" : "btn-primary"}`} disabled={busy} onClick={() => input.current?.click()}>
              {busy ? "Uploading…" : review === "rejected" ? "Upload replacement" : doc ? "Replace" : "Upload"}
            </button>
          </div>
        )}
      </div>
      {error && (
        <p className="error small mt8" role="alert" style={{ color: "var(--err)" }}>
          {error}
        </p>
      )}
    </div>
  );
}

export default function Documents({ docs, locked = false, onChange, only, set = "application" }: {
  docs: Doc[];
  locked?: boolean;
  onChange: (docs: Doc[]) => void;
  only?: "optional";
  set?: "application" | "enrolment";
}) {
  const latest = (kind: string) => [...docs].reverse().find((d) => d.kind === kind);
  const base = set === "enrolment" ? enrolmentDocs : documentKinds;
  const kinds = only === "optional" ? base.filter((k) => !k.required) : base;
  return (
    <div className="stack">
      {kinds.map((k) => (
        <Slot
          key={k.kind}
          {...k}
          doc={latest(k.kind)}
          locked={locked}
          reviewed={set === "enrolment"}
          onChange={(d, kind) => onChange(d ? [...docs.filter((x) => locked || x.kind !== kind), d] : docs.filter((x) => x.kind !== kind))}
        />
      ))}
      <p className="small muted">PDF, JPG or PNG, up to 4 MB.</p>
    </div>
  );
}
