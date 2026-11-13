"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";
import { fieldError, paymentStep, type Data } from "@/lib/form";

/** The bank account allowances are paid to: shown masked, and changeable in full. */
export default function PaymentDetails({ initial, account }: { initial: Data; account: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState(!account);
  const [v, setV] = useState<Data>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  if (!editing)
    return (
      <div className="stack" style={{ gap: 12 }}>
        <dl className="kv">
          <dt>Account</dt>
          <dd>{account}</dd>
          <dt>Account holder</dt>
          <dd>{initial.account_holder}</dd>
          <dt>Country</dt>
          <dd>{initial.bank_country}</dd>
        </dl>
        {msg && <div className={`alert ${msg.ok ? "alert-ok" : "alert-err"}`} role="status">{msg.text}</div>}
        <div>
          <button className="btn btn-outline btn-sm" onClick={() => (setEditing(true), setMsg(null))}>
            Change payment details
          </button>
        </div>
      </div>
    );

  const fields = paymentStep.fields.filter((f) => !f.showIf || f.showIf(v));
  return (
    <form
      className="stack"
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        const errs: Record<string, string> = {};
        for (const f of fields) {
          const x = fieldError(f, v);
          if (x) errs[f.name] = x;
        }
        setErrors(errs);
        if (Object.keys(errs).length) return;
        setBusy(true);
        setMsg(null);
        try {
          await api("/api/application/payment", { method: "PUT", json: { data: v } });
          setMsg({ ok: true, text: "Payment details saved. A confirmation has been sent to your email." });
          setEditing(false);
          router.refresh();
        } catch (x) {
          setMsg({ ok: false, text: (x as Error).message });
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="formgrid">
        {fields.map((f) => (
          <div key={f.name} className="field">
            <label htmlFor={`pd_${f.name}`}>
              {f.label}
              {!f.required && <span className="opt"> (optional)</span>}
            </label>
            {errors[f.name] && <span className="error">{errors[f.name]}</span>}
            {f.type === "select" ? (
              <select id={`pd_${f.name}`} className="input" value={v[f.name] ?? ""} aria-invalid={!!errors[f.name]} onChange={(e) => setV((x) => ({ ...x, [f.name]: e.target.value }))}>
                <option value="">- Select -</option>
                {f.options!.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            ) : (
              <input
                id={`pd_${f.name}`}
                className="input"
                autoComplete="off"
                inputMode={f.digits ? "numeric" : undefined}
                maxLength={f.maxLength ?? f.digits}
                value={v[f.name] ?? ""}
                aria-invalid={!!errors[f.name]}
                onChange={(e) => setV((x) => ({ ...x, [f.name]: f.digits ? e.target.value.replace(/\D/g, "") : e.target.value }))}
              />
            )}
          </div>
        ))}
      </div>
      {msg && <div className={`alert ${msg.ok ? "alert-ok" : "alert-err"}`} role="status">{msg.text}</div>}
      <div className="flex">
        <button className="btn btn-primary btn-sm" disabled={busy}>
          {busy ? "Saving" : "Save payment details"}
        </button>
        {account && (
          <button type="button" className="btn btn-outline btn-sm" onClick={() => (setEditing(false), setV(initial), setErrors({}))}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
