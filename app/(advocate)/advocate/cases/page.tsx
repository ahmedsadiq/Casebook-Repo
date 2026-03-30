import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { formatDate, isDateUpdateRequired, normalizeCaseStatus } from "@/lib/utils";
import { CaseStatusBadge } from "@/components/StatusBadge";
import CasesFilter from "./CasesFilter";
import type { CaseStatus } from "@/lib/supabase/types";
import DeleteCaseButton from "./[id]/DeleteCaseButton";
import AssignClientControl from "./AssignClientControl";

export const metadata = { title: "Cases" };
export const dynamic = "force-dynamic";

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
    .map((caseItem) => ({
      ...caseItem,
      status: normalizeCaseStatus(caseItem.status),
      needs_date_update: isDateUpdateRequired(caseItem.next_hearing_date),
    }))
    .filter((caseItem) => (!statusFilter || caseItem.status === statusFilter) && (!searchQuery || caseItem.title.toLowerCase().includes(searchQuery)));

  const { data: allClients } = await supabase
    .from("profiles")
    .select("id,full_name,email")
    .eq("advocate_id", user!.id)
    .eq("role", "client")
    .order("full_name");

  const caseIds = cases.map((caseItem) => caseItem.id);
  const { data: assignedAssociates } = caseIds.length
    ? await supabase
        .from("case_associates")
        .select("case_id,associate_id,profiles!case_associates_associate_id_fkey(full_name)")
        .in("case_id", caseIds)
    : { data: [] };

  const clientMap = Object.fromEntries((allClients ?? []).map((client) => [client.id, client.full_name]));
  const associatesByCase = (assignedAssociates ?? []).reduce<Record<string, string[]>>((acc, row) => {
    const associateProfile = row.profiles as unknown as { full_name: string | null } | { full_name: string | null }[] | null;
    const associateName = Array.isArray(associateProfile)
      ? associateProfile[0]?.full_name ?? "Associate"
      : associateProfile?.full_name ?? "Associate";
    if (!acc[row.case_id]) acc[row.case_id] = [];
    acc[row.case_id].push(associateName);
    return acc;
  }, {});

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
            <table className="w-full min-w-[920px]">
              <thead>
                <tr className="thead">
                  <th className="w-[29%]">Case</th>
                  <th className="w-[16%]">Client</th>
                  <th className="w-[20%]">Associates</th>
                  <th className="w-[12%]">Status</th>
                  <th className="w-[10%]">Last Hearing</th>
                  <th className="w-[10%]">Next Hearing</th>
                  <th className="w-[3%]"></th>
                </tr>
              </thead>
              <tbody>
                {cases.map((caseItem) => {
                  const needsUpdate = Boolean(caseItem.needs_date_update);
                  const associateNames = associatesByCase[caseItem.id] ?? [];

                  return (
                    <tr key={caseItem.id} className="trow">
                      <td className="tcell align-top">
                        <Link href={`/advocate/cases/${caseItem.id}`} className="font-medium text-gray-900 hover:text-navy-700">
                          {caseItem.title}
                        </Link>
                        {caseItem.case_number && (
                          <p className="mt-0.5 text-xs leading-5 text-gray-400">
                            #{caseItem.case_number} {caseItem.court ? `· ${caseItem.court}` : ""}
                          </p>
                        )}
                        {needsUpdate && (
                          <span className="mt-1.5 inline-flex rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                            Action Required - Date Not Updated
                          </span>
                        )}
                      </td>
                      <td className="tcell align-top text-gray-600">
                        <div className="space-y-1">
                          <p className={`leading-5 ${caseItem.client_id && clientMap[caseItem.client_id] ? "" : "text-gray-400"}`}>
                            {caseItem.client_id && clientMap[caseItem.client_id] ? clientMap[caseItem.client_id] : "No client assigned"}
                          </p>
                          {!caseItem.client_id && (
                            <AssignClientControl
                              caseId={caseItem.id}
                              currentClientId={caseItem.client_id}
                              clients={allClients ?? []}
                              compact
                            />
                          )}
                        </div>
                      </td>
                      <td className="tcell align-top text-gray-600">
                        {associateNames.length ? (
                          <div className="flex max-w-full flex-wrap gap-1.5">
                            {associateNames.slice(0, 2).map((name) => (
                              <span
                                key={`${caseItem.id}-${name}`}
                                className="inline-flex max-w-full items-center rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-semibold leading-tight text-violet-700"
                              >
                                {name}
                              </span>
                            ))}
                            {associateNames.length > 2 && (
                              <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-500">
                                +{associateNames.length - 2}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">No associate assigned</span>
                        )}
                      </td>
                      <td className="tcell align-top">
                        <div className="flex min-h-[2.25rem] items-start">
                          <CaseStatusBadge status={caseItem.status} />
                        </div>
                      </td>
                      <td className="tcell align-top whitespace-nowrap text-gray-500">
                        {caseItem.last_hearing_date ? formatDate(caseItem.last_hearing_date) : <span className="text-gray-300">-</span>}
                      </td>
                      <td className={`tcell align-top whitespace-nowrap ${needsUpdate ? "text-red-600 font-semibold" : "text-gray-500"}`}>
                        {formatDate(caseItem.next_hearing_date)}
                      </td>
                      <td className="tcell align-top text-right">
                        <div className="flex items-start justify-end gap-2 whitespace-nowrap">
                          <Link href={`/advocate/cases/${caseItem.id}/edit`} className="btn-secondary btn-sm">Edit</Link>
                          <DeleteCaseButton caseId={caseItem.id} caseTitle={caseItem.title} />
                        </div>
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
