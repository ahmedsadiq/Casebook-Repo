"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function MarkPaidButton({ paymentId }: { paymentId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  async function markPaid() {
    if (!confirm("Mark this payment as paid?")) return;
    setLoading(true);
    await supabase.from("payments").update({ status: "paid" }).eq("id", paymentId);
    router.refresh();
    setLoading(false);
  }

  return (
    <button onClick={markPaid} disabled={loading} className="btn-secondary btn-sm text-emerald-600 border-emerald-200 hover:bg-emerald-50">
      {loading ? "…" : "Mark Paid"}
    </button>
  );
}
