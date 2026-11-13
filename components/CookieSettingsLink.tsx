"use client";

import { openCookieSettings } from "@/lib/consent";

/** Reopens the cookie banner so a visitor can change their choice at any time. */
export default function CookieSettingsLink({ className = "textlink", children = "Cookie settings" }: { className?: string; children?: React.ReactNode }) {
  return (
    <button type="button" className={className} onClick={openCookieSettings}>
      {children}
    </button>
  );
}
