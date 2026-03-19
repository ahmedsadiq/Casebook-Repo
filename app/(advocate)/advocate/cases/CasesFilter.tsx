"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState, useTransition } from "react";

export default function CasesFilter({
  initialQ, initialStatus, basePath,
}: { initialQ: string; initialStatus: string; basePath: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [, start] = useTransition();
  const [q, setQ] = useState(initialQ);
  const [status, setStatus] = useState(initialStatus);
  const base = basePath || pathname;

  function apply(newQ: string, newStatus: string) {
    const p = new URLSearchParams();
    if (newQ) p.set("q", newQ);
    if (newStatus) p.set("status", newStatus);
    start(() => router.push(`${base}?${p.toString()}`));
  }

  return (
    <div className="flex flex-wrap gap-3">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="m21 21-4.35-4.35"/>
        </svg>
        <input type="search" className="input pl-9 w-64" placeholder="Search by title…"
          value={q} onChange={e => { setQ(e.target.value); apply(e.target.value, status); }} />
      </div>
      <select className="input w-44" value={status}
        onChange={e => { setStatus(e.target.value); apply(q, e.target.value); }}>
        <option value="">All statuses</option>
        <option value="open">Open</option>
        <option value="pending">Pending</option>
        <option value="closed">Closed</option>
      </select>
    </div>
  );
}
