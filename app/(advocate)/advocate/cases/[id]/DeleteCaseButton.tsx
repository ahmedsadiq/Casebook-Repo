"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ConfirmDialog from "@/components/ConfirmDialog";

export default function DeleteCaseButton({ caseId, caseTitle }: { caseId: string; caseTitle: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setError(null);
    setLoading(true);

    try {
      const { error: deleteError } = await supabase.from("cases").delete().eq("id", caseId);
      if (deleteError) throw deleteError;

      setOpen(false);
      router.push("/advocate/cases");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete. Please try again.");
      setLoading(false);
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} disabled={loading} className="btn-danger btn-sm">
        {loading ? "Deleting..." : "Delete"}
      </button>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      <ConfirmDialog
        open={open}
        title="Delete case?"
        description={`Delete "${caseTitle}"? This will permanently remove the case, all updates, payments, and documents. This cannot be undone.`}
        confirmLabel="Delete case"
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
