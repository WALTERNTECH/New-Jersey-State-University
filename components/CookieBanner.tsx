"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { OPEN_SETTINGS_EVENT, readConsent, writeConsent } from "@/lib/consent";

/**
 * Cookie banner: Accept all, or Customise. Shown until the visitor chooses, and again whenever
 * "Cookie settings" is opened from the footer or the cookie policy.
 */
export default function CookieBanner() {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = readConsent();
    if (!saved) setOpen(true);
    else setAnalytics(saved.analytics);
    const onOpen = () => {
      setAnalytics(readConsent()?.analytics ?? false);
      setCustom(true);
      setOpen(true);
      requestAnimationFrame(() => panel.current?.focus());
    };
    window.addEventListener(OPEN_SETTINGS_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_SETTINGS_EVENT, onOpen);
  }, []);

  if (!open) return null;

  const save = (choice: { analytics: boolean }) => {
    writeConsent(choice);
    setAnalytics(choice.analytics);
    setOpen(false);
    setCustom(false);
  };

  return (
    <div className="cookies" role="region" aria-label="Cookies on this site" ref={panel} tabIndex={-1}>
      <div className="wrap">
        <h2>Cookies on this site</h2>
        {!custom ? (
          <>
            <p>We use cookies to keep you signed in and to make this site work.</p>
            <div className="cookies-actions">
              <button type="button" className="btn btn-primary" onClick={() => save({ analytics: true })}>
                Accept all cookies
              </button>
              <button type="button" className="btn btn-outline" onClick={() => setCustom(true)}>
                Customise
              </button>
              <Link href="/cookies" className="cookies-link">
                Cookie policy
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="cookies-cats">
              <fieldset className="cookies-cat">
                <legend>Strictly necessary</legend>
                <p>Keep you signed in to your application and remember your cookie choice.</p>
                <span className="cookies-on">Always on</span>
              </fieldset>
              <fieldset className="cookies-cat">
                <legend>Analytics</legend>
                <p>Help us understand how the site is used. Not in use at present.</p>
                <div className="fa-radios">
                  <label className="fa-radio">
                    <input type="radio" name="ck_analytics" checked={analytics} onChange={() => setAnalytics(true)} />
                    <span>On</span>
                  </label>
                  <label className="fa-radio">
                    <input type="radio" name="ck_analytics" checked={!analytics} onChange={() => setAnalytics(false)} />
                    <span>Off</span>
                  </label>
                </div>
              </fieldset>
            </div>
            <div className="cookies-actions">
              <button type="button" className="btn btn-primary" onClick={() => save({ analytics })}>
                Save preferences
              </button>
              <button type="button" className="btn btn-outline" onClick={() => save({ analytics: true })}>
                Accept all cookies
              </button>
              <Link href="/cookies" className="cookies-link">
                Cookie policy
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
