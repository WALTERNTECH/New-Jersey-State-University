// The visitor's cookie choice, kept in a first-party cookie for a year. Strictly necessary cookies
// (sign-in sessions and this choice itself) are always on; anything optional must check
// hasConsent() before it runs. No optional cookies are in use at present.

export const CONSENT_COOKIE = "njsu_consent";
export const CONSENT_VERSION = "1";
export const OPEN_SETTINGS_EVENT = "njsu:cookie-settings";

export type Consent = { analytics: boolean };

/** The saved choice, or null if the visitor has not chosen yet (or chose under an older version). */
export function readConsent(): Consent | null {
  if (typeof document === "undefined") return null;
  const raw = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${CONSENT_COOKIE}=`))
    ?.split("=")[1];
  if (!raw) return null;
  const [version, analytics] = decodeURIComponent(raw).split(":");
  if (version !== CONSENT_VERSION) return null;
  return { analytics: analytics === "a1" };
}

export function writeConsent(c: Consent) {
  const value = encodeURIComponent(`${CONSENT_VERSION}:${c.analytics ? "a1" : "a0"}`);
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CONSENT_COOKIE}=${value}; Max-Age=31536000; Path=/; SameSite=Lax${secure}`;
}

export const hasConsent = (category: keyof Consent) => readConsent()?.[category] === true;

/** Opens the cookie settings from anywhere, for example the footer link. */
export const openCookieSettings = () => window.dispatchEvent(new Event(OPEN_SETTINGS_EVENT));
