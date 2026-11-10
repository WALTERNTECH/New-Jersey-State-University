"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function FilterBar({ countries, majors }: { countries: string[]; majors: string[] }) {
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const active = ["country", "major", "sort"].filter((k) => params.get(k)).length;
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
      <select className="input" aria-label="Programme" value={params.get("major") ?? ""} onChange={(e) => push({ major: e.target.value })}>
        <option value="">All programmes</option>
        {majors.map((c) => (
          <option key={c}>{c}</option>
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
