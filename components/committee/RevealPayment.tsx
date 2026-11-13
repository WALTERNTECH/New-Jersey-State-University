"use client";

import { useState } from "react";
import { api } from "@/lib/client";
import { paymentStep } from "@/lib/form";

/** Masked by default; the full details are fetched on request and the view is logged. */
export function RevealPayment({ appId, canReveal }: { appId: string; canReveal: boolean }) {
  const [details, setDetails] = useState<Record<string, string> | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (details)
    return (
      <dl className="c-dl" style={{ margin: "0 -20px -18px" }}>
        {paymentStep.fields
          .filter((f) => details[f.name])
          .map((f) => (
            <div key={f.name} style={{ display: "contents" }}>
              <dt>{f.label}</dt>
              <dd className={f.name === "account_number" || f.name === "bsb" || f.name === "swift" ? "mono" : ""}>{details[f.name]}</dd>
            </div>
          ))}
      </dl>
    );
  if (!canReveal) return <p className="small muted">The committee chair or owner can view the full details.</p>;
  return (
    <span className="flex">
      <button
        className="btn btn-ghost btn-sm"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            const r = await api<{ details: Record<string, string> }>(`/api/committee/applications/${appId}/payment`, { method: "POST" });
            setDetails(r.details);
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "Opening" : "Show full bank details"}
      </button>
      {error && <span className="small" style={{ color: "var(--err)" }}>{error}</span>}
    </span>
  );
}
