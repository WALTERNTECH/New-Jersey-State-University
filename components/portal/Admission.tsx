"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";

export function OfferReply({ replyBy }: { replyBy: string }) {
  const router = useRouter();
  const [choice, setChoice] = useState<"" | "accept" | "decline">("");
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function send() {
    setBusy(true);
    setError("");
    try {
      await api("/api/offer", { method: "POST", json: { decision: choice, confirm } });
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="stack">
      <p className="small muted">Please reply by {replyBy}. Your reply is final once submitted.</p>
      <div className="c-choice" role="radiogroup" aria-label="Your reply">
        <label className={choice === "accept" ? "on" : ""}>
          <input type="radio" name="reply" checked={choice === "accept"} onChange={() => (setChoice("accept"), setConfirm(false))} />
          <span>
            <b>I accept the offer of admission</b>
            <span>I intend to enrol at New Jersey State University in the coming academic year.</span>
          </span>
        </label>
        <label className={choice === "decline" ? "on" : ""}>
          <input type="radio" name="reply" checked={choice === "decline"} onChange={() => (setChoice("decline"), setConfirm(false))} />
          <span>
            <b>I decline the offer</b>
            <span>The place will be offered to another candidate.</span>
          </span>
        </label>
      </div>
      {choice && (
        <label className="check">
          <input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} />
          <span>
            {choice === "accept"
              ? "I confirm that I accept this offer, that the information in my application is accurate, and that I will report to campus in person to complete enrolment."
              : "I confirm that I wish to decline this offer of admission and the Access Scholarship."}
          </span>
        </label>
      )}
      {error && <div className="alert alert-err" role="alert">{error}</div>}
      <div>
        <button className={`btn ${choice === "decline" ? "btn-ghost" : "btn-primary"}`} disabled={!choice || !confirm || busy} onClick={send}>
          {busy ? "Submitting…" : choice === "decline" ? "Decline offer" : "Accept offer"}
        </button>
      </div>
    </div>
  );
}

type Arrival = { arrival_date?: string; mode?: string; arrival_point?: string; carrier?: string; contact_name?: string; contact_phone?: string; contact_relationship?: string };

export function ArrivalForm({ initial }: { initial: Arrival | null }) {
  const router = useRouter();
  const [v, setV] = useState<Arrival>({ mode: "Air", ...(initial ?? {}) });
  const [editing, setEditing] = useState(!initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const set = (k: keyof Arrival) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setV((x) => ({ ...x, [k]: e.target.value }));

  if (!editing && initial) {
    return (
      <div className="stack" style={{ gap: 10 }}>
        <dl className="kv">
          <dt>Arrival</dt>
          <dd>{new Date(initial.arrival_date!).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</dd>
          <dt>Travel</dt>
          <dd>{initial.mode} · {initial.arrival_point}{initial.carrier ? ` · ${initial.carrier}` : ""}</dd>
          <dt>Emergency contact</dt>
          <dd>{initial.contact_name} ({initial.contact_relationship}), {initial.contact_phone}</dd>
        </dl>
        <div>
          <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>Update arrival plan</button>
        </div>
      </div>
    );
  }

  return (
    <form
      className="stack"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setMsg(null);
        try {
          await api("/api/arrival", { method: "POST", json: v });
          setMsg({ ok: true, text: "Arrival plan saved" });
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
        <div className="field">
          <label htmlFor="ad">Expected arrival date</label>
          <input id="ad" className="input" type="date" required value={v.arrival_date ?? ""} onChange={set("arrival_date")} />
        </div>
        <div className="field">
          <label htmlFor="am">Means of travel</label>
          <select id="am" className="input" value={v.mode} onChange={set("mode")}>
            <option>Air</option>
            <option>Rail</option>
            <option>Road</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="ap">Arrival airport or station</label>
          <input id="ap" className="input" required placeholder="e.g. Newark Liberty International (EWR)" value={v.arrival_point ?? ""} onChange={set("arrival_point")} />
        </div>
        <div className="field">
          <label htmlFor="ac">Airline and flight number <span className="opt">If known</span></label>
          <input id="ac" className="input" value={v.carrier ?? ""} onChange={set("carrier")} />
        </div>
        <div className="field">
          <label htmlFor="cn">Emergency contact name</label>
          <input id="cn" className="input" required value={v.contact_name ?? ""} onChange={set("contact_name")} />
        </div>
        <div className="field">
          <label htmlFor="cr">Relationship to you</label>
          <input id="cr" className="input" required placeholder="e.g. Mother" value={v.contact_relationship ?? ""} onChange={set("contact_relationship")} />
        </div>
        <div className="field full">
          <label htmlFor="cp">Emergency contact telephone</label>
          <input id="cp" className="input" type="tel" required placeholder="Include the country code" value={v.contact_phone ?? ""} onChange={set("contact_phone")} />
        </div>
      </div>
      {msg && <div className={`alert ${msg.ok ? "alert-ok" : "alert-err"}`} role="status">{msg.text}</div>}
      <div className="flex">
        <button className="btn btn-primary btn-sm" disabled={busy}>{busy ? "Saving…" : "Save arrival plan"}</button>
        {initial && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>Cancel</button>}
      </div>
    </form>
  );
}
