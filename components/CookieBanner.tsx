"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { OPEN_SETTINGS_EVENT, readConsent, writeConsent } from "@/lib/consent";

/**
 * Cookie notice in the usual form: a compact bar with Accept all and Customise, and a preference
 * centre for choosing categories. Shown until the visitor chooses; reopened from "Cookie settings".
 */
export default function CookieBanner() {
  const [bar, setBar] = useState(false);
  const [prefs, setPrefs] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const dialog = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = readConsent();
    if (!saved) setBar(true);
    else setAnalytics(saved.analytics);
    const onOpen = () => {
      setAnalytics(readConsent()?.analytics ?? false);
      setPrefs(true);
    };
    window.addEventListener(OPEN_SETTINGS_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_SETTINGS_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (!prefs) return;
    dialog.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPrefs(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prefs]);

  const save = (choice: { analytics: boolean }) => {
    writeConsent(choice);
    setAnalytics(choice.analytics);
    setBar(false);
    setPrefs(false);
  };

  return (
    <>
      {bar && !prefs && (
        <div className="ckbar" role="region" aria-label="Cookie consent">
          <div className="ckbar-in">
            <p>
              We use cookies and similar technologies that are necessary to provide this website securely, such as keeping you signed in and protecting your
              account. With your consent, we may also use analytics cookies to understand how the website is used. See our{" "}
              <Link href="/cookies">Cookie Policy</Link> and <Link href="/privacy">Privacy Policy</Link>.
            </p>
            <div className="ckbar-actions">
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setPrefs(true)}>
                Customise
              </button>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => save({ analytics: true })}>
                Accept all
              </button>
            </div>
          </div>
        </div>
      )}

      {prefs && (
        <div className="ckmodal" onClick={(e) => e.target === e.currentTarget && setPrefs(false)}>
          <div className="ckpanel" role="dialog" aria-modal="true" aria-labelledby="ck-title" tabIndex={-1} ref={dialog}>
            <header>
              <h2 id="ck-title">Cookie preferences</h2>
              <button type="button" className="ckclose" aria-label="Close" onClick={() => setPrefs(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </header>
            <div className="ckbody">
              <p>
                When you visit this website, it may store or retrieve information on your browser in the form of cookies. You can choose which categories you
                allow. Blocking some types of cookies may affect your experience of the website.
              </p>
              <section className="ckcat">
                <div className="ckcat-h">
                  <h3>Strictly necessary cookies</h3>
                  <span className="ckalways">Always active</span>
                </div>
                <p>
                  These cookies are essential for the website to function and cannot be switched off. They are used for secure sign-in, keeping your session
                  active, preventing fraud and remembering your privacy choices.
                </p>
              </section>
              <section className="ckcat">
                <div className="ckcat-h">
                  <h3>
                    <label htmlFor="ck-analytics">Performance and analytics cookies</label>
                  </h3>
                  <span className="ckswitch">
                    <input id="ck-analytics" type="checkbox" role="switch" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} />
                    <span aria-hidden />
                  </span>
                </div>
                <p>
                  These cookies allow us to count visits and understand how visitors use the website so that we can improve it. No analytics cookies are set
                  at present.
                </p>
              </section>
              <p className="small">
                <Link href="/cookies">Cookie Policy</Link> · <Link href="/privacy">Privacy Policy</Link>
              </p>
            </div>
            <footer>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => save({ analytics: false })}>
                Reject all
              </button>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => save({ analytics })}>
                Save preferences
              </button>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => save({ analytics: true })}>
                Accept all
              </button>
            </footer>
          </div>
        </div>
      )}
    </>
  );
}
