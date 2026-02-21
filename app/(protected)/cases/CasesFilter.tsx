"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState, useTransition } from "react";

export default function CasesFilter({
  initialQ,
  initialStatus,
}: {
  initialQ: string;
  initialStatus: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [q, setQ] = useState(initialQ);
  const [status, setStatus] = useState(initialStatus);

  function applyFilter(newQ: string, newStatus: string) {
    const params = new URLSearchParams();
    if (newQ) params.set("q", newQ);
    if (newStatus) params.set("status", newStatus);
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <div className="flex gap-3">
      <input
        type="search"
        className="input max-w-xs"
        placeholder="Search by title…"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          applyFilter(e.target.value, status);
        }}
      />
      <select
        className="input w-40"
        value={status}
        onChange={(e) => {
          setStatus(e.target.value);
          applyFilter(q, e.target.value);
        }}
      >
        <option value="">All statuses</option>
        <option value="open">Open</option>
        <option value="pending">Pending</option>
        <option value="closed">Closed</option>
      </select>
      {isPending && <span className="text-sm text-gray-400 self-center">Loading…</span>}
    </div>
  );
}
