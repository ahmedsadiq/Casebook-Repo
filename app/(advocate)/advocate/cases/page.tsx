import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { formatDate, isDateUpdateRequired, normalizeCaseStatus } from "@/lib/utils";
import { CaseStatusBadge } from "@/components/StatusBadge";
import CasesFilter from "./CasesFilter";
import type { CaseStatus } from "@/lib/supabase/types";

export const metadata = { title: "Cases" };

const VALID_STATUSES: CaseStatus[] = ["Pending", "Decided", "Disposed of", "Date in Office", "Rejected", "Accepted"];

export default async function CasesPage({ searchParams }: { searchParams: { q?: string; status?: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: rawCases } = await supabase
    .from("cases")
    .select("*")
    .eq("advocate_id", user!.id)
    .order("created_at", { ascending: false });

  const statusFilter = searchParams.status && VALID_STATUSES.includes(searchParams.status as CaseStatus)
    ? searchParams.status as CaseStatus
    : "";
  const searchQuery = searchParams.q?.trim().toLowerCase() ?? "";

  const cases = (rawCases ?? [])
    .map(c => ({
      ...c,
      status: normalizeCaseStatus(c.status),
      needs_date_update: isDateUpdateRequired(c.next_hearing_date),
    }))
    .filter(c => (!statusFilter || c.status === statusFilter) && (!searchQuery || c.title.toLowerCase().includes(searchQuery)));

  const clientIds = [...new Set(cases.map(c => c.client_id).filter(Boolean) as string[])];
  const { data: clientProfiles } = clientIds.length
    ? await supabase.from("profiles").select("id,full_name").in("id", clientIds)
    : { data: [] };
  const clientMap = Object.fromEntries((clientProfiles ?? []).map(p => [p.id, p.full_name]));

  return (
    <div className="pg-wrap">
      <div className="pg-head">
        <div>
          <h1 className="pg-title">Cases</h1>
          <p className="pg-sub">{cases.length} case{cases.length !== 1 ? "s" : ""}</p>
        </div>
        <Link href="/advocate/cases/new" className="btn-primary">+ New Case</Link>
      </div>

      <CasesFilter initialQ={searchParams.q ?? ""} initialStatus={searchParams.status ?? ""} basePath="/advocate/cases" />

      <div className="card mt-4">
        {!cases.length ? (
          <div className="py-16 text-center">
            <p className="mb-3 text-sm text-gray-400">
              {searchParams.q || searchParams.status ? "No cases match your filters." : "No cases yet."}
            </p>
            {!searchParams.q && !searchParams.status && (
              <Link href="/advocate/cases/new" className="btn-primary btn-sm inline-flex">Create your first case</Link>
            )}
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table-wide">
              <thead>
                <tr className="thead">
                  <th>Case</th><th>Client</th><th>Status</th><th>Last Hearing</th><th>Next Hearing</th><th></th>
                </tr>
              </thead>
              <tbody>
                {cases.map(c => {
                  const needsUpdate = Boolean(c.needs_date_update);
                  return (
                    <tr key={c.id} className="trow">
                      <td className="tcell">
                        <Link href={`/advocate/cases/${c.id}`} className="font-medium text-gray-900 hover:text-navy-700">{c.title}</Link>
                        {c.case_number && <p className="mt-0.5 text-xs text-gray-400">#{c.case_number} {c.court ? `· ${c.court}` : ""}</p>}
                        {needsUpdate && (
                          <span className="mt-1.5 inline-flex rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                            Action Required - Date Not Updated
                          </span>
                        )}
                      </td>
                      <td className="tcell text-gray-600">{c.client_id ? (clientMap[c.client_id] ?? <span className="text-gray-300">—</span>) : <span className="text-gray-300">—</span>}</td>
                      <td className="tcell"><CaseStatusBadge status={c.status} /></td>
                      <td className="tcell text-gray-500">{formatDate(c.last_hearing_date)}</td>
                      <td className={`tcell ${needsUpdate ? "text-red-600 font-semibold" : "text-gray-500"}`}>
                        {formatDate(c.next_hearing_date)}
                      </td>
                      <td className="tcell text-right">
                        <Link href={`/advocate/cases/${c.id}/edit`} className="btn-secondary btn-sm">Edit</Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
