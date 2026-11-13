// Small fetch helper for our own API: sends the request header the server requires and surfaces errors as text.
export async function api<T = Record<string, unknown>>(url: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("x-njsu", "1");
  let body = init.body;
  if (init.json !== undefined) {
    headers.set("content-type", "application/json");
    body = JSON.stringify(init.json);
  }
  const res = await fetch(url, { ...init, headers, body });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    const err = new Error(data.error || "Something went wrong. Please try again.") as Error & { status?: number; data?: unknown };
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

/** Every date and time on the site is shown in Sydney time. */
export const TZ = "Australia/Sydney";

/** Calendar dates stored without a time (YYYY-MM-DD) are shown as the same calendar date everywhere. */
const dateOnly = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);

export const fmtDate = (s: string | null | undefined, withTime = false) =>
  s
    ? new Date(s).toLocaleString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: dateOnly(s) ? "UTC" : TZ,
        ...(withTime && !dateOnly(s) ? { hour: "2-digit", minute: "2-digit" } : {}),
      }) + (withTime && !dateOnly(s) ? ` ${tzAbbr(s)}` : "")
    : "";

/** AEDT in the southern summer, AEST otherwise. */
function tzAbbr(s: string) {
  const part = new Intl.DateTimeFormat("en-AU", { timeZone: TZ, timeZoneName: "short" }).formatToParts(new Date(s)).find((p) => p.type === "timeZoneName");
  return part?.value ?? "Sydney";
}

export const fmtSize = (n: number) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
