import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatDate, formatCurrency } from "@/lib/utils";
import { PaymentStatusBadge } from "@/components/StatusBadge";
import PaymentForm from "./PaymentForm";
import DeletePaymentButton from "./DeletePaymentButton";
import MarkPaidButton from "./MarkPaidButton";

export const metadata = { title: "Payments" };

export default async function PaymentsPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: c }, { data: payments }] = await Promise.all([
    supabase.from("cases").select("id,title").eq("id", params.id).eq("advocate_id", user!.id).single(),
    supabase.from("payments").select("*").eq("case_id", params.id).order("due_date"),
  ]);

  if (!c) notFound();

  const totalPaid    = payments?.filter(p => p.status === "paid").reduce((s, p) => s + p.amount, 0) ?? 0;
  const totalPending = payments?.filter(p => p.status !== "paid").reduce((s, p) => s + p.amount, 0) ?? 0;

  return (
    <div className="pg-wrap max-w-3xl">
      <div className="mb-6">
        <Link href={`/advocate/cases/${c.id}`} className="text-sm text-gray-400 hover:text-gray-600 mb-1.5 inline-block">← {c.title}</Link>
        <h1 className="pg-title">Payment Schedule</h1>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card p-5">
          <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide">Collected</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(totalPaid)}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide">Outstanding</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{formatCurrency(totalPending)}</p>
        </div>
      </div>

      {/* Existing payments */}
      {!!payments?.length && (
        <div className="card mb-6">
          <div className="card-header"><h2 className="text-sm font-semibold text-gray-700">All Payments</h2></div>
          <table className="w-full">
            <thead><tr className="thead"><th>Description</th><th>Amount</th><th>Due Date</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id} className="trow">
                  <td className="tcell font-medium text-gray-800">{p.description}</td>
                  <td className="tcell font-semibold text-gray-900">{formatCurrency(p.amount)}</td>
                  <td className="tcell text-gray-500">{formatDate(p.due_date)}</td>
                  <td className="tcell"><PaymentStatusBadge status={p.status} /></td>
                  <td className="tcell">
                    <div className="flex items-center gap-2 justify-end">
                      {p.status !== "paid" && <MarkPaidButton paymentId={p.id} />}
                      <DeletePaymentButton paymentId={p.id} desc={p.description} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add new payment */}
      <div className="card">
        <div className="card-header"><h2 className="text-sm font-semibold text-gray-700">Add Payment Entry</h2></div>
        <div className="card-body">
          <PaymentForm caseId={c.id} />
        </div>
      </div>
    </div>
  );
}
