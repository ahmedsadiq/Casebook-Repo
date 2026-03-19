import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { formatDate, formatCurrency } from "@/lib/utils";
import { CaseStatusBadge } from "@/components/StatusBadge";
import TasksWidget from "@/components/TasksWidget";

export const metadata = { title: "Dashboard" };

const ACTIVE_STATUSES = ["Pending", "Date in Office"] as const;

export default async function AdvocateDashboard() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const today = new Date().toISOString().slice(0, 10);

  const [
    { data: todayCasesRaw },
    { data: pendingCasesRaw },
    { data: recentCases },
    { data: allCases },
    { data: clients },
    { data: associates },
    { data: payments },
    { data: tasks },
  ] = await Promise.all([
    supabase.from("case_with_alerts")
      .select("id,title,status,case_number,court,client_id,next_hearing_date,needs_date_update")
      .eq("advocate_id", user!.id)
      .eq("next_hearing_date", today)
      .order("next_hearing_date", { ascending: true }),
    supabase.from("case_with_alerts")
      .select("id,title,status,case_number,court,client_id,next_hearing_date,needs_date_update")
      .eq("advocate_id", user!.id)
      .in("status", ACTIVE_STATUSES as unknown as string[])
      .order("next_hearing_date", { ascending: true }),
    supabase.from("case_with_alerts").select("id,title,status,case_number,last_hearing_date,next_hearing_date,created_at,needs_date_update")
      .eq("advocate_id", user!.id).order("created_at", { ascending: false }).limit(5),
    supabase.from("cases").select("status").eq("advocate_id", user!.id),
    supabase.from("profiles").select("id").eq("advocate_id", user!.id).eq("role", "client"),
    supabase.from("profiles").select("id").eq("advocate_id", user!.id).eq("role", "associate"),
    supabase.from("payments").select("status,amount").eq("advocate_id", user!.id),
    supabase.from("tasks").select("id,title,due_date,completed,created_at").eq("user_id", user!.id).order("created_at", { ascending: false }),
  ]);

  const todayCases = todayCasesRaw ?? [];
  const pendingCases = pendingCasesRaw ?? [];
  const clientIds = [...new Set([...todayCases, ...pendingCases].map(c => c.client_id).filter(Boolean) as string[])];
  const { data: clientProfiles } = clientIds.length
    ? await supabase.from("profiles").select("id,full_name").in("id", clientIds)
    : { data: [] };
  const clientMap = Object.fromEntries((clientProfiles ?? []).map(p => [p.id, p.full_name]));

  const counts = {
    total:    allCases?.length ?? 0,
    pending:  allCases?.filter(c => c.status === "Pending").length ?? 0,
    decided:  allCases?.filter(c => c.status === "Decided").length ?? 0,
    disposed: allCases?.filter(c => c.status === "Disposed of").length ?? 0,
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
        <div className="flex items-center gap-2">
          <Link href="/advocate/calendar" className="btn-secondary">Calendar</Link>
          <Link href="/advocate/cases/new" className="btn-primary">+ New Case</Link>
        </div>
      </div>

      {/* Today's cases */}
      <div className="card mb-6">
        <div className="card-header">
          <h2 className="text-sm font-semibold text-gray-800">Today's Cases</h2>
          <span className="text-xs text-gray-400">{today}</span>
        </div>
        {!todayCases.length ? (
          <div className="card-body text-sm text-gray-400">No hearings scheduled for today.</div>
        ) : (
          <table className="w-full">
            <thead><tr className="thead"><th>Case</th><th>Client</th><th>Court</th><th>Case #</th><th>Status</th></tr></thead>
            <tbody>
              {todayCases.map(c => (
                <tr key={c.id} className="trow">
                  <td className="tcell">
                    <Link href={`/advocate/cases/${c.id}`} className="font-medium text-gray-900 hover:text-navy-700">{c.title}</Link>
                  </td>
                  <td className="tcell text-gray-600">{c.client_id ? (clientMap[c.client_id] ?? "—") : "—"}</td>
                  <td className="tcell text-gray-600">{c.court ?? "—"}</td>
                  <td className="tcell text-gray-600">{c.case_number ?? "—"}</td>
                  <td className="tcell"><CaseStatusBadge status={c.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pending cases */}
      <div className="card mb-6">
        <div className="card-header">
          <h2 className="text-sm font-semibold text-gray-800">All Pending Cases</h2>
          <span className="text-xs text-gray-400">{pendingCases.length} case{pendingCases.length !== 1 ? "s" : ""}</span>
        </div>
        {!pendingCases.length ? (
          <div className="card-body text-sm text-gray-400">No pending cases.</div>
        ) : (
          <table className="w-full">
            <thead><tr className="thead"><th>Case</th><th>Client</th><th>Court</th><th>Case #</th><th>Status</th><th>Next Hearing</th></tr></thead>
            <tbody>
              {pendingCases.map(c => (
                <tr key={c.id} className="trow">
                  <td className="tcell">
                    <Link href={`/advocate/cases/${c.id}`} className="font-medium text-gray-900 hover:text-navy-700">{c.title}</Link>
                  </td>
                  <td className="tcell text-gray-600">{c.client_id ? (clientMap[c.client_id] ?? "—") : "—"}</td>
                  <td className="tcell text-gray-600">{c.court ?? "—"}</td>
                  <td className="tcell text-gray-600">{c.case_number ?? "—"}</td>
                  <td className="tcell"><CaseStatusBadge status={c.status} /></td>
                  <td className={`tcell ${(c as { needs_date_update?: boolean }).needs_date_update ? "text-red-600 font-semibold" : "text-gray-500"}`}>
                    {formatDate(c.next_hearing_date)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Case stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Cases", value: counts.total,    color: "text-gray-900" },
          { label: "Pending",     value: counts.pending,  color: "text-amber-600" },
          { label: "Decided",     value: counts.decided,  color: "text-navy-700" },
          { label: "Disposed of", value: counts.disposed, color: "text-gray-400" },
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
            <thead><tr className="thead"><th>Title</th><th>Status</th><th>Last Hearing</th><th>Next Hearing</th><th>Created</th></tr></thead>
            <tbody>
              {recentCases.map(c => (
                <tr key={c.id} className="trow">
                  <td className="tcell">
                    <Link href={`/advocate/cases/${c.id}`} className="font-medium text-gray-900 hover:text-navy-700">{c.title}</Link>
                    {c.case_number && <p className="text-xs text-gray-400 mt-0.5">#{c.case_number}</p>}
                    {(c as { needs_date_update?: boolean }).needs_date_update && (
                      <span className="inline-flex mt-1.5 rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                        Action Required
                      </span>
                    )}
                  </td>
                  <td className="tcell"><CaseStatusBadge status={c.status} /></td>
                  <td className="tcell text-gray-500">{formatDate(c.last_hearing_date)}</td>
                  <td className={`tcell ${(c as { needs_date_update?: boolean }).needs_date_update ? "text-red-600 font-semibold" : "text-gray-500"}`}>
                    {formatDate(c.next_hearing_date)}
                  </td>
                  <td className="tcell text-gray-400">{formatDate(c.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-6">
        <TasksWidget initialTasks={(tasks ?? []) as { id: string; title: string; due_date: string | null; completed: boolean; created_at: string }[]} />
      </div>
    </div>
  );
}
