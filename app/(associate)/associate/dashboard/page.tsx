import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { formatDate, isActiveCaseStatus, isDateUpdateRequired, normalizeCaseStatus } from "@/lib/utils";
import { CaseStatusBadge } from "@/components/StatusBadge";
import TasksWidget from "@/components/TasksWidget";

export const metadata = { title: "Dashboard" };

export default async function AssociateDashboard() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const today = new Date().toISOString().slice(0, 10);

  const { data: assigned } = await supabase
    .from("case_associates")
    .select("case_id")
    .eq("associate_id", user!.id);

  const caseIds = (assigned ?? []).map(a => a.case_id);

  const [{ data: rawCases }, { data: tasks }] = await Promise.all([
    caseIds.length
      ? supabase.from("cases").select("*").in("id", caseIds).order("updated_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    supabase.from("tasks").select("id,title,due_date,completed,created_at").eq("user_id", user!.id).order("created_at", { ascending: false }),
  ]);

  const cases = (rawCases ?? []).map(c => ({
    ...c,
    status: normalizeCaseStatus(c.status),
    needs_date_update: isDateUpdateRequired(c.next_hearing_date),
  }));

  const todayCases = cases
    .filter(c => c.next_hearing_date === today)
    .sort((a, b) => (a.next_hearing_date ?? "").localeCompare(b.next_hearing_date ?? ""));
  const pendingCases = cases
    .filter(c => isActiveCaseStatus(c.status))
    .sort((a, b) => (a.next_hearing_date ?? "").localeCompare(b.next_hearing_date ?? ""));
  const recentCases = [...cases]
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .slice(0, 8);

  const clientIds = [...new Set([...todayCases, ...pendingCases].map(c => c.client_id).filter(Boolean) as string[])];
  const { data: clientProfiles } = clientIds.length
    ? await supabase.from("profiles").select("id,full_name").in("id", clientIds)
    : { data: [] };
  const clientMap = Object.fromEntries((clientProfiles ?? []).map(p => [p.id, p.full_name]));

  const counts = {
    total: cases.length,
    pending: cases.filter(c => c.status === "Pending").length,
    decided: cases.filter(c => c.status === "Decided").length,
  };

  return (
    <div className="pg-wrap">
      <div className="pg-head">
        <div>
          <h1 className="pg-title">Dashboard</h1>
          <p className="pg-sub">Cases you are working on</p>
        </div>
        <Link href="/associate/calendar" className="btn-secondary">Calendar</Link>
      </div>

      <div className="card mb-6">
        <div className="card-header">
          <h2 className="text-sm font-semibold text-gray-800">Today's Cases</h2>
          <span className="text-xs text-gray-400">{today}</span>
        </div>
        {!todayCases.length ? (
          <div className="card-body text-sm text-gray-400">No hearings scheduled for today.</div>
        ) : (
          <div className="table-wrap">
            <table className="data-table-wide">
              <thead><tr className="thead"><th>Case</th><th>Client</th><th>Court</th><th>Case #</th><th>Status</th></tr></thead>
              <tbody>
                {todayCases.map(c => (
                  <tr key={c.id} className="trow">
                    <td className="tcell">
                      <Link href={`/associate/cases/${c.id}`} className="font-medium text-gray-900 hover:text-navy-700">{c.title}</Link>
                    </td>
                    <td className="tcell text-gray-600">{c.client_id ? (clientMap[c.client_id] ?? "—") : "—"}</td>
                    <td className="tcell text-gray-600">{c.court ?? "—"}</td>
                    <td className="tcell text-gray-600">{c.case_number ?? "—"}</td>
                    <td className="tcell"><CaseStatusBadge status={c.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card mb-6">
        <div className="card-header">
          <h2 className="text-sm font-semibold text-gray-800">All Pending Cases</h2>
          <span className="text-xs text-gray-400">{pendingCases.length} case{pendingCases.length !== 1 ? "s" : ""}</span>
        </div>
        {!pendingCases.length ? (
          <div className="card-body text-sm text-gray-400">No pending cases.</div>
        ) : (
          <div className="table-wrap">
            <table className="data-table-wide">
              <thead><tr className="thead"><th>Case</th><th>Client</th><th>Court</th><th>Case #</th><th>Status</th><th>Next Hearing</th></tr></thead>
              <tbody>
                {pendingCases.map(c => (
                  <tr key={c.id} className="trow">
                    <td className="tcell">
                      <Link href={`/associate/cases/${c.id}`} className="font-medium text-gray-900 hover:text-navy-700">{c.title}</Link>
                    </td>
                    <td className="tcell text-gray-600">{c.client_id ? (clientMap[c.client_id] ?? "—") : "—"}</td>
                    <td className="tcell text-gray-600">{c.court ?? "—"}</td>
                    <td className="tcell text-gray-600">{c.case_number ?? "—"}</td>
                    <td className="tcell"><CaseStatusBadge status={c.status} /></td>
                    <td className={`tcell ${c.needs_date_update ? "text-red-600 font-semibold" : "text-gray-500"}`}>
                      {formatDate(c.next_hearing_date)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Total Cases", value: counts.total, color: "text-gray-900" },
          { label: "Pending", value: counts.pending, color: "text-amber-600" },
          { label: "Decided", value: counts.decided, color: "text-navy-700" },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
            <p className={`mt-1.5 text-3xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="text-sm font-semibold text-gray-800">Cases</h2>
          <Link href="/associate/cases" className="text-sm text-navy-600 hover:underline">View all</Link>
        </div>
        {!recentCases.length ? (
          <div className="py-14 text-center text-sm text-gray-400">
            <p>No cases assigned to you yet.</p>
            <p className="mt-1 text-xs">Your advocate will assign you to cases from the case detail page.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr className="thead"><th>Title</th><th>Status</th><th>Last Hearing</th><th>Next Hearing</th></tr></thead>
              <tbody>
                {recentCases.map(c => (
                  <tr key={c.id} className="trow">
                    <td className="tcell">
                      <Link href={`/associate/cases/${c.id}`} className="font-medium text-gray-900 hover:text-navy-700">{c.title}</Link>
                      {c.case_number && <p className="mt-0.5 text-xs text-gray-400">#{c.case_number}</p>}
                    </td>
                    <td className="tcell"><CaseStatusBadge status={c.status} /></td>
                    <td className="tcell text-gray-500">{formatDate(c.last_hearing_date)}</td>
                    <td className="tcell text-gray-500">{formatDate(c.next_hearing_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-6">
        <TasksWidget initialTasks={(tasks ?? []) as { id: string; title: string; due_date: string | null; completed: boolean; created_at: string }[]} />
      </div>
    </div>
  );
}
