"use client";

import { useState } from "react";
import { countryByName, joinPhone, splitPhone } from "@/lib/form";
import { eligibleCountries } from "@/lib/content";

/**
 * A country, then the number after its code. The stored value is "+254 712345678": the code comes
 * from the country chosen, never from what is typed, and a leading 0 is dropped.
 */
export default function PhoneInput({ id, value, onChange, onBlur, invalid, defaultCountry, describedBy }: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  invalid?: boolean;
  defaultCountry?: string;
  describedBy?: string;
}) {
  const parsed = splitPhone(value);
  const [country, setCountry] = useState(parsed.country?.name ?? (countryByName(defaultCountry) ? defaultCountry! : ""));
  const c = countryByName(country);
  const national = parsed.country ? parsed.national : (value ?? "").replace(/\D/g, "");
  return (
    <div className="phone">
      <select
        className="input phone-cc"
        aria-label="Country"
        value={country}
        aria-invalid={invalid && !c}
        onChange={(e) => {
          setCountry(e.target.value);
          onChange(joinPhone(countryByName(e.target.value), national));
        }}
        onBlur={onBlur}
      >
        <option value="">Country</option>
        {eligibleCountries.map((x) => (
          <option key={x.name} value={x.name}>
            {x.name} ({x.dial})
          </option>
        ))}
      </select>
      <div className="phone-num">
        <span className="phone-dial" aria-hidden>{c?.dial ?? "+"}</span>
        <input
          id={id}
          className="input"
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          value={national}
          disabled={!c}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          onChange={(e) => onChange(joinPhone(c, e.target.value))}
          onBlur={onBlur}
        />
      </div>
    </div>
  );
}
