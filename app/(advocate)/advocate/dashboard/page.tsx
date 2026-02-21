import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { formatDate, formatCurrency } from "@/lib/utils";
import { CaseStatusBadge } from "@/components/StatusBadge";

export const metadata = { title: "Dashboard" };

export default async function AdvocateDashboard() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [
    { data: recentCases },
    { data: allCases },
    { data: clients },
    { data: associates },
    { data: payments },
  ] = await Promise.all([
    supabase.from("cases").select("id,title,status,case_number,next_hearing_date,created_at")
      .eq("advocate_id", user!.id).order("created_at", { ascending: false }).limit(5),
    supabase.from("cases").select("status").eq("advocate_id", user!.id),
    supabase.from("profiles").select("id").eq("advocate_id", user!.id).eq("role", "client"),
    supabase.from("profiles").select("id").eq("advocate_id", user!.id).eq("role", "associate"),
    supabase.from("payments").select("status,amount").eq("advocate_id", user!.id),
  ]);

  const counts = {
    total:   allCases?.length ?? 0,
    open:    allCases?.filter(c => c.status === "open").length ?? 0,
    pending: allCases?.filter(c => c.status === "pending").length ?? 0,
    closed:  allCases?.filter(c => c.status === "closed").length ?? 0,
  };
  const overdue = payments?.filter(p => p.status === "overdue").reduce((s, p) => s + p.amount, 0) ?? 0;
  const pending = payments?.filter(p => p.status === "pending").reduce((s, p) => s + p.amount, 0) ?? 0;

  return (
    <div className="pg-wrap">
      <div className="pg-head">
        <div>
          <h1 className="pg-title">Dashboard</h1>
          <p className="pg-sub">Your practice at a glance</p>
        </div>
        <Link href="/advocate/cases/new" className="btn-primary">+ New Case</Link>
      </div>

      {/* Case stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Cases", value: counts.total,   color: "text-gray-900" },
          { label: "Open",        value: counts.open,    color: "text-emerald-600" },
          { label: "Pending",     value: counts.pending, color: "text-amber-600" },
          { label: "Closed",      value: counts.closed,  color: "text-gray-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
            <p className={`text-3xl font-bold mt-1.5 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* People + payments */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Clients</p>
          <p className="text-3xl font-bold mt-1.5 text-navy-700">{clients?.length ?? 0}</p>
          <Link href="/advocate/clients" className="text-xs text-navy-600 hover:underline mt-1.5 block">Manage →</Link>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Associates</p>
          <p className="text-3xl font-bold mt-1.5 text-violet-600">{associates?.length ?? 0}</p>
          <Link href="/advocate/associates" className="text-xs text-violet-600 hover:underline mt-1.5 block">Manage →</Link>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Pending Fees</p>
          <p className="text-2xl font-bold mt-1.5 text-amber-600">{formatCurrency(pending)}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Overdue</p>
          <p className="text-2xl font-bold mt-1.5 text-red-600">{overdue > 0 ? formatCurrency(overdue) : "—"}</p>
        </div>
      </div>

      {/* Recent cases */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-sm font-semibold text-gray-800">Recent Cases</h2>
          <Link href="/advocate/cases" className="text-sm text-navy-600 hover:underline">View all →</Link>
        </div>
        {!recentCases?.length ? (
          <div className="py-14 text-center">
            <p className="text-gray-400 text-sm mb-3">No cases yet.</p>
            <Link href="/advocate/cases/new" className="btn-primary btn-sm inline-flex">Create your first case</Link>
          </div>
        ) : (
          <table className="w-full">
            <thead><tr className="thead"><th>Title</th><th>Status</th><th>Next Hearing</th><th>Created</th></tr></thead>
            <tbody>
              {recentCases.map(c => (
                <tr key={c.id} className="trow">
                  <td className="tcell">
                    <Link href={`/advocate/cases/${c.id}`} className="font-medium text-gray-900 hover:text-navy-700">{c.title}</Link>
                    {c.case_number && <p className="text-xs text-gray-400 mt-0.5">#{c.case_number}</p>}
                  </td>
                  <td className="tcell"><CaseStatusBadge status={c.status} /></td>
                  <td className="tcell text-gray-500">{formatDate(c.next_hearing_date)}</td>
                  <td className="tcell text-gray-400">{formatDate(c.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
