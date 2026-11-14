"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

type Level = { id: string; label: string; programmes: string[] };

export default function FilterBar({ countries, levels }: { countries: string[]; levels: Level[] }) {
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const active = ["country", "level", "major", "sort"].filter((k) => params.get(k)).length;
  const level = levels.find((l) => l.id === params.get("level"));
  const [more, setMore] = useState(false);

  const push = (changes: Record<string, string>) => {
    const p = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(changes)) v ? p.set(k, v) : p.delete(k);
    p.delete("page");
    router.push(`${path}?${p.toString()}`);
  };

  return (
    <form
      className="c-filters"
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        push({ q: q.trim() });
      }}
    >
      <input className="input grow" type="search" placeholder="Search name, email or reference" aria-label="Search" value={q} onChange={(e) => setQ(e.target.value)} onBlur={() => q !== (params.get("q") ?? "") && push({ q: q.trim() })} />
      <button type="button" className="btn btn-ghost btn-sm c-morebtn" aria-expanded={more} onClick={() => setMore((v) => !v)}>
        Filters{active ? ` (${active})` : ""}
      </button>
      <div className={`c-more${more ? " open" : ""}`}>
      <select className="input" aria-label="Country" value={params.get("country") ?? ""} onChange={(e) => push({ country: e.target.value })}>
        <option value="">All countries</option>
        {countries.map((c) => (
          <option key={c}>{c}</option>
        ))}
      </select>
      <select className="input" aria-label="Level of study" value={params.get("level") ?? ""} onChange={(e) => push({ level: e.target.value, major: "" })}>
        <option value="">All levels</option>
        {levels.map((l) => (
          <option key={l.id} value={l.id}>{l.label}</option>
        ))}
      </select>
      <select className="input" aria-label="Programme" value={params.get("major") ?? ""} onChange={(e) => push({ major: e.target.value })}>
        <option value="">All programmes</option>
        {(level ? [level] : levels).map((l) => (
          <optgroup key={l.id} label={l.label}>
            {l.programmes.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </optgroup>
        ))}
      </select>
      <select className="input" aria-label="Sort by" value={params.get("sort") ?? "recent"} onChange={(e) => push({ sort: e.target.value === "recent" ? "" : e.target.value })}>
        <option value="recent">Newest first</option>
        <option value="oldest">Oldest first</option>
        <option value="score">Highest score</option>
        <option value="name">Name A–Z</option>
      </select>
      </div>
    </form>
  );
}
