import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { formatDate, formatCurrency } from "@/lib/utils";
import { CaseStatusBadge, PaymentStatusBadge } from "@/components/StatusBadge";

export const metadata = { title: "My Cases" };

export default async function ClientDashboard() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles").select("advocate_id").eq("id", user!.id).single();

  const [{ data: cases }, { data: advocate }, { data: associates }] = await Promise.all([
    supabase.from("cases")
      .select("id,title,status,next_hearing_date,case_number,court")
      .eq("client_id", user!.id)
      .order("updated_at", { ascending: false }),
    supabase.from("profiles")
      .select("full_name,email,phone").eq("id", profile!.advocate_id!).single(),
    supabase.from("profiles")
      .select("full_name,email,phone")
      .eq("advocate_id", profile!.advocate_id!).eq("role", "associate"),
  ]);

  // Get payments for client's cases
  const caseIds = cases?.map(c => c.id) ?? [];
  const { data: payments } = caseIds.length
    ? await supabase.from("payments").select("*").in("case_id", caseIds).order("due_date")
    : { data: [] };

  const pendingTotal = payments?.filter(p => p.status !== "paid").reduce((s, p) => s + p.amount, 0) ?? 0;

  return (
    <div className="pg-wrap">
      <div className="pg-head">
        <div><h1 className="pg-title">My Cases</h1><p className="pg-sub">Progress and updates</p></div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Active Cases</p>
          <p className="text-3xl font-bold text-navy-700 mt-1.5">{cases?.filter(c => c.status !== "closed").length ?? 0}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Next Hearing</p>
          <p className="text-base font-bold text-gray-900 mt-1.5">
            {cases?.find(c => c.next_hearing_date) ? formatDate(cases.find(c => c.next_hearing_date)!.next_hearing_date) : "—"}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Pending Dues</p>
          <p className="text-2xl font-bold text-amber-600 mt-1.5">{formatCurrency(pendingTotal)}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="card">
            <div className="card-header"><h2 className="text-sm font-semibold text-gray-700">Your Cases</h2></div>
            {!cases?.length ? (
              <div className="py-14 text-center text-sm text-gray-400">No cases assigned to you yet.</div>
            ) : (
              <table className="w-full">
                <thead><tr className="thead"><th>Case</th><th>Status</th><th>Next Hearing</th></tr></thead>
                <tbody>
                  {cases.map(c => (
                    <tr key={c.id} className="trow">
                      <td className="tcell">
                        <Link href={`/client/cases/${c.id}`} className="font-medium text-gray-900 hover:text-navy-700">{c.title}</Link>
                        {c.case_number && <p className="text-xs text-gray-400 mt-0.5">#{c.case_number} {c.court ? `· ${c.court}` : ""}</p>}
                      </td>
                      <td className="tcell"><CaseStatusBadge status={c.status} /></td>
                      <td className="tcell text-gray-500">{formatDate(c.next_hearing_date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {payments && payments.length > 0 && (
            <div className="card">
              <div className="card-header"><h2 className="text-sm font-semibold text-gray-700">Payment Schedule</h2></div>
              <table className="w-full">
                <thead><tr className="thead"><th>Description</th><th>Amount</th><th>Due Date</th><th>Status</th></tr></thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p.id} className="trow">
                      <td className="tcell font-medium text-gray-800">{p.description}</td>
                      <td className="tcell font-semibold text-gray-900">{formatCurrency(p.amount)}</td>
                      <td className="tcell text-gray-500">{formatDate(p.due_date)}</td>
                      <td className="tcell"><PaymentStatusBadge status={p.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="space-y-5">
          {advocate && (
            <div className="card">
              <div className="card-header"><h2 className="text-sm font-semibold text-gray-700">Your Advocate</h2></div>
              <div className="card-body text-sm space-y-1">
                <p className="font-semibold text-gray-900">{advocate.full_name ?? "—"}</p>
                <span className="role-advocate inline-flex">advocate</span>
                {advocate.email && <p className="text-gray-500 mt-1">{advocate.email}</p>}
                {advocate.phone && <p className="text-gray-500">{advocate.phone}</p>}
              </div>
            </div>
          )}
          {associates && associates.length > 0 && (
            <div className="card">
              <div className="card-header"><h2 className="text-sm font-semibold text-gray-700">Legal Team</h2></div>
              <div className="divide-y divide-gray-100">
                {associates.map((a, i) => (
                  <div key={i} className="px-5 py-3.5 text-sm">
                    <p className="font-medium text-gray-800">{a.full_name ?? "—"}</p>
                    {a.email && <p className="text-gray-500 text-xs mt-0.5">{a.email}</p>}
                    {a.phone && <p className="text-gray-400 text-xs">{a.phone}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
