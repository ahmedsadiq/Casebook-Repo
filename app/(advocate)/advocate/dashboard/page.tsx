import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { formatDate, formatCurrency, isActiveCaseStatus, isDateUpdateRequired, normalizeCaseStatus } from "@/lib/utils";
import { CaseStatusBadge } from "@/components/StatusBadge";
import TasksWidget from "@/components/TasksWidget";

export const metadata = { title: "Dashboard" };

export default async function AdvocateDashboard() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const today = new Date().toISOString().slice(0, 10);

  const [
    { data: rawCases },
    { data: clients },
    { data: associates },
    { data: payments },
    { data: tasks },
  ] = await Promise.all([
    supabase.from("cases").select("*").eq("advocate_id", user!.id).order("created_at", { ascending: false }),
    supabase.from("profiles").select("id").eq("advocate_id", user!.id).eq("role", "client"),
    supabase.from("profiles").select("id").eq("advocate_id", user!.id).eq("role", "associate"),
    supabase.from("payments").select("status,amount").eq("advocate_id", user!.id),
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
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 5);

  const clientIds = [...new Set([...todayCases, ...pendingCases].map(c => c.client_id).filter(Boolean) as string[])];
  const { data: clientProfiles } = clientIds.length
    ? await supabase.from("profiles").select("id,full_name").in("id", clientIds)
    : { data: [] };
  const clientMap = Object.fromEntries((clientProfiles ?? []).map(p => [p.id, p.full_name]));

  const counts = {
    total: cases.length,
    pending: cases.filter(c => c.status === "Pending").length,
    decided: cases.filter(c => c.status === "Decided").length,
    disposed: cases.filter(c => c.status === "Disposed of").length,
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
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Link href="/advocate/calendar" className="btn-secondary">Calendar</Link>
          <Link href="/advocate/cases/new" className="btn-primary">+ New Case</Link>
        </div>
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
                      <Link href={`/advocate/cases/${c.id}`} className="font-medium text-gray-900 hover:text-navy-700">{c.title}</Link>
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

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Cases", value: counts.total, color: "text-gray-900" },
          { label: "Pending", value: counts.pending, color: "text-amber-600" },
          { label: "Decided", value: counts.decided, color: "text-navy-700" },
          { label: "Disposed of", value: counts.disposed, color: "text-gray-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
            <p className={`mt-1.5 text-3xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Clients</p>
          <p className="mt-1.5 text-3xl font-bold text-navy-700">{clients?.length ?? 0}</p>
          <Link href="/advocate/clients" className="mt-1.5 block text-xs text-navy-600 hover:underline">Manage →</Link>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Associates</p>
          <p className="mt-1.5 text-3xl font-bold text-violet-600">{associates?.length ?? 0}</p>
          <Link href="/advocate/associates" className="mt-1.5 block text-xs text-violet-600 hover:underline">Manage →</Link>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Pending Fees</p>
          <p className="mt-1.5 text-2xl font-bold text-amber-600">{formatCurrency(pending)}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Overdue</p>
          <p className="mt-1.5 text-2xl font-bold text-red-600">{overdue > 0 ? formatCurrency(overdue) : "—"}</p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="text-sm font-semibold text-gray-800">Recent Cases</h2>
          <Link href="/advocate/cases" className="text-sm text-navy-600 hover:underline">View all →</Link>
        </div>
        {!recentCases.length ? (
          <div className="py-14 text-center">
            <p className="mb-3 text-sm text-gray-400">No cases yet.</p>
            <Link href="/advocate/cases/new" className="btn-primary btn-sm inline-flex">Create your first case</Link>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr className="thead"><th>Title</th><th>Status</th><th>Last Hearing</th><th>Next Hearing</th><th>Created</th></tr></thead>
              <tbody>
                {recentCases.map(c => (
                  <tr key={c.id} className="trow">
                    <td className="tcell">
                      <Link href={`/advocate/cases/${c.id}`} className="font-medium text-gray-900 hover:text-navy-700">{c.title}</Link>
                      {c.case_number && <p className="mt-0.5 text-xs text-gray-400">#{c.case_number}</p>}
                      {c.needs_date_update && (
                        <span className="mt-1.5 inline-flex rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                          Action Required
                        </span>
                      )}
                    </td>
                    <td className="tcell"><CaseStatusBadge status={c.status} /></td>
                    <td className="tcell text-gray-500">{formatDate(c.last_hearing_date)}</td>
                    <td className={`tcell ${c.needs_date_update ? "text-red-600 font-semibold" : "text-gray-500"}`}>
                      {formatDate(c.next_hearing_date)}
                    </td>
                    <td className="tcell text-gray-400">{formatDate(c.created_at)}</td>
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
