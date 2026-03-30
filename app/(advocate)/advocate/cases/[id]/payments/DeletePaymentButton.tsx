"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ConfirmDialog from "@/components/ConfirmDialog";

export default function DeletePaymentButton({ paymentId, desc }: { paymentId: string; desc: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setError(null);
    setLoading(true);

    try {
      const { error: deleteError } = await supabase.from("payments").delete().eq("id", paymentId);
      if (deleteError) throw deleteError;

      setOpen(false);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete payment.");
      setLoading(false);
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} disabled={loading} className="btn-ghost btn-sm text-red-500 hover:bg-red-50 hover:text-red-600">
        {loading ? "..." : "Delete"}
      </button>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      <ConfirmDialog
        open={open}
        title="Delete payment?"
        description={`Delete payment "${desc}"? This cannot be undone.`}
        confirmLabel="Delete payment"
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
