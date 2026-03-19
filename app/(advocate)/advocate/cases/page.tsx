import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { CaseStatusBadge } from "@/components/StatusBadge";
import CasesFilter from "./CasesFilter";
import type { CaseStatus } from "@/lib/supabase/types";

export const metadata = { title: "Cases" };

export default async function CasesPage({ searchParams }: { searchParams: { q?: string; status?: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let query = supabase
    .from("cases")
    .select("id,title,status,case_number,court,next_hearing_date,created_at,client_id")
    .eq("advocate_id", user!.id)
    .order("created_at", { ascending: false });

  const valid: CaseStatus[] = ["open", "pending", "closed"];
  if (searchParams.status && valid.includes(searchParams.status as CaseStatus))
    query = query.eq("status", searchParams.status);
  if (searchParams.q)
    query = query.ilike("title", `%${searchParams.q}%`);

  const { data: cases } = await query;

  // Fetch client names separately to avoid FK-join failures in production
  const clientIds = [...new Set((cases ?? []).map(c => c.client_id).filter(Boolean) as string[])];
  const { data: clientProfiles } = clientIds.length
    ? await supabase.from("profiles").select("id,full_name").in("id", clientIds)
    : { data: [] };
  const clientMap = Object.fromEntries((clientProfiles ?? []).map(p => [p.id, p.full_name]));

  return (
    <div className="pg-wrap">
      <div className="pg-head">
        <div>
          <h1 className="pg-title">Cases</h1>
          <p className="pg-sub">{cases?.length ?? 0} case{cases?.length !== 1 ? "s" : ""}</p>
        </div>
        <Link href="/advocate/cases/new" className="btn-primary">+ New Case</Link>
      </div>

      <CasesFilter initialQ={searchParams.q ?? ""} initialStatus={searchParams.status ?? ""} basePath="/advocate/cases" />

      <div className="card mt-4">
        {!cases?.length ? (
          <div className="py-16 text-center">
            <p className="text-gray-400 text-sm mb-3">
              {searchParams.q || searchParams.status ? "No cases match your filters." : "No cases yet."}
            </p>
            {!searchParams.q && !searchParams.status && (
              <Link href="/advocate/cases/new" className="btn-primary btn-sm inline-flex">Create your first case</Link>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="thead">
                <th>Case</th><th>Client</th><th>Status</th><th>Next Hearing</th><th></th>
              </tr>
            </thead>
            <tbody>
              {cases.map(c => {
                return (
                  <tr key={c.id} className="trow">
                    <td className="tcell">
                      <Link href={`/advocate/cases/${c.id}`} className="font-medium text-gray-900 hover:text-navy-700">{c.title}</Link>
                      {c.case_number && <p className="text-xs text-gray-400 mt-0.5">#{c.case_number} {c.court ? `· ${c.court}` : ""}</p>}
                    </td>
                    <td className="tcell text-gray-600">{c.client_id ? (clientMap[c.client_id] ?? <span className="text-gray-300">—</span>) : <span className="text-gray-300">—</span>}</td>
                    <td className="tcell"><CaseStatusBadge status={c.status} /></td>
                    <td className="tcell text-gray-500">{formatDate(c.next_hearing_date)}</td>
                    <td className="tcell text-right">
                      <Link href={`/advocate/cases/${c.id}/edit`} className="btn-secondary btn-sm">Edit</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
