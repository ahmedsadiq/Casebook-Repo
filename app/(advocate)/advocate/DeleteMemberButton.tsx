"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmDialog from "@/components/ConfirmDialog";

export default function DeleteMemberButton({ memberId, name }: { memberId: string; name: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/members/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to delete. Please try again.");

      setOpen(false);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={loading}
        className="btn-ghost btn-sm text-red-500 hover:bg-red-50 hover:text-red-600"
      >
        {loading ? "..." : "Remove"}
      </button>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      <ConfirmDialog
        open={open}
        title="Remove team member?"
        description={`Remove "${name}" from your team? Their account will be deleted.`}
        confirmLabel="Remove"
        tone="danger"
        loading={loading}
        onCancel={() => {
          if (loading) return;
          setOpen(false);
        }}
        onConfirm={handleDelete}
      />
    </>
  );
}
