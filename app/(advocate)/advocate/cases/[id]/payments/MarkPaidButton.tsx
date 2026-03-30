"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ConfirmDialog from "@/components/ConfirmDialog";

export default function MarkPaidButton({ paymentId }: { paymentId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function markPaid() {
    setError(null);
    setLoading(true);

    try {
      const { error: updateError } = await supabase.from("payments").update({ status: "paid" }).eq("id", paymentId);
      if (updateError) throw updateError;

      setOpen(false);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to mark payment as paid.");
      setLoading(false);
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} disabled={loading} className="btn-secondary btn-sm text-emerald-600 border-emerald-200 hover:bg-emerald-50">
        {loading ? "..." : "Mark Paid"}
      </button>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      <ConfirmDialog
        open={open}
        title="Mark payment as paid?"
        description="This will update the payment status to paid immediately."
        confirmLabel="Mark paid"
        loading={loading}
        onCancel={() => {
          if (loading) return;
          setOpen(false);
        }}
        onConfirm={markPaid}
      />
    </>
  );
}
