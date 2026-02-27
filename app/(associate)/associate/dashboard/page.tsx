import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { CaseStatusBadge } from "@/components/StatusBadge";

export const metadata = { title: "Dashboard" };

export default async function AssociateDashboard() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Get only cases this associate is assigned to
  const { data: assigned } = await supabase
    .from("case_associates")
    .select("case_id")
    .eq("associate_id", user!.id);

  const caseIds = (assigned ?? []).map(a => a.case_id);

  const [{ data: cases }, { data: allCases }] = await (caseIds.length
    ? Promise.all([
        supabase.from("cases")
          .select("id,title,status,case_number,next_hearing_date")
          .in("id", caseIds)
          .order("updated_at", { ascending: false }).limit(8),
        supabase.from("cases").select("status").in("id", caseIds),
      ])
    : [{ data: [] as { id: string; title: string; status: string; case_number: string | null; next_hearing_date: string | null }[] },
       { data: [] as { status: string }[] }]);

  const counts = {
    total:   allCases?.length ?? 0,
    open:    allCases?.filter(c => c.status === "open").length ?? 0,
    pending: allCases?.filter(c => c.status === "pending").length ?? 0,
  };

  return (
    <div className="pg-wrap">
      <div className="pg-head">
        <div><h1 className="pg-title">Dashboard</h1><p className="pg-sub">Cases you are working on</p></div>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total Cases", value: counts.total,   color: "text-gray-900" },
          { label: "Open",        value: counts.open,    color: "text-emerald-600" },
          { label: "Pending",     value: counts.pending, color: "text-amber-600" },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
            <p className={`text-3xl font-bold mt-1.5 ${color}`}>{value}</p>
          </div>
        ))}
      </div>
      <div className="card">
        <div className="card-header">
          <h2 className="text-sm font-semibold text-gray-800">Cases</h2>
          <Link href="/associate/cases" className="text-sm text-navy-600 hover:underline">View all</Link>
        </div>
        {!cases?.length ? (
          <div className="py-14 text-center text-sm text-gray-400">
            <p>No cases assigned to you yet.</p>
            <p className="text-xs mt-1">Your advocate will assign you to cases from the case detail page.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead><tr className="thead"><th>Title</th><th>Status</th><th>Next Hearing</th></tr></thead>
            <tbody>
              {cases.map(c => (
                <tr key={c.id} className="trow">
                  <td className="tcell">
                    <Link href={`/associate/cases/${c.id}`} className="font-medium text-gray-900 hover:text-navy-700">{c.title}</Link>
                    {c.case_number && <p className="text-xs text-gray-400 mt-0.5">#{c.case_number}</p>}
                  </td>
                  <td className="tcell"><CaseStatusBadge status={c.status} /></td>
                  <td className="tcell text-gray-500">{formatDate(c.next_hearing_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
