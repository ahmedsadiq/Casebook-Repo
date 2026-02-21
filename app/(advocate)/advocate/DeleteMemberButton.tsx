"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteMemberButton({ memberId, name }: { memberId: string; name: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm(`Remove "${name}" from your team? Their account will be deleted.`)) return;
    setLoading(true);
    const res = await fetch("/api/members/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId }),
    });
    if (!res.ok) { alert("Failed to delete. Please try again."); setLoading(false); return; }
    router.refresh();
    setLoading(false);
  }

  return (
    <button onClick={handleDelete} disabled={loading}
      className="btn-ghost btn-sm text-red-500 hover:bg-red-50 hover:text-red-600">
      {loading ? "…" : "Remove"}
    </button>
  );
}
