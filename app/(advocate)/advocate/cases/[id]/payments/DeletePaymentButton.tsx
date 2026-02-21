"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DeletePaymentButton({ paymentId, desc }: { paymentId: string; desc: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete payment "${desc}"? This cannot be undone.`)) return;
    setLoading(true);
    await supabase.from("payments").delete().eq("id", paymentId);
    router.refresh();
    setLoading(false);
  }

  return (
    <button onClick={handleDelete} disabled={loading} className="btn-ghost btn-sm text-red-500 hover:bg-red-50 hover:text-red-600">
      {loading ? "…" : "Delete"}
    </button>
  );
}
