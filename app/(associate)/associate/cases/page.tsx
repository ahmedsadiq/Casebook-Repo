import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { CaseStatusBadge } from "@/components/StatusBadge";

export const metadata = { title: "Cases" };

export default async function AssociateCasesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Get only cases this associate is assigned to via case_associates
  const { data: assigned } = await supabase
    .from("case_associates")
    .select("case_id")
    .eq("associate_id", user!.id);

  const caseIds = (assigned ?? []).map(a => a.case_id);

  const { data: rawCases } = caseIds.length
    ? await supabase
        .from("cases")
        .select("id,title,status,case_number,court,next_hearing_date,created_at,client_id")
        .in("id", caseIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  // Fetch client names separately to avoid FK-join failures in production
  const clientIds = [...new Set((rawCases ?? []).map(c => c.client_id).filter(Boolean) as string[])];
  const { data: clientProfiles } = clientIds.length
    ? await supabase.from("profiles").select("id,full_name").in("id", clientIds)
    : { data: [] };
  const clientMap = Object.fromEntries((clientProfiles ?? []).map(p => [p.id, p.full_name]));
  const cases = rawCases;

  return (
    <div className="pg-wrap">
      <div className="pg-head">
        <div>
          <h1 className="pg-title">Cases</h1>
          <p className="pg-sub">{cases?.length ?? 0} case{cases?.length !== 1 ? "s" : ""}</p>
        </div>
      </div>
      <div className="card">
        {!cases?.length ? (
          <div className="py-16 text-center text-sm text-gray-400">No cases found.</div>
        ) : (
          <table className="w-full">
            <thead><tr className="thead"><th>Case</th><th>Client</th><th>Status</th><th>Next Hearing</th></tr></thead>
            <tbody>
              {(cases ?? []).map(c => {
                return (
                  <tr key={c.id} className="trow">
                    <td className="tcell">
                      <Link href={`/associate/cases/${c.id}`} className="font-medium text-gray-900 hover:text-navy-700">{c.title}</Link>
                      {c.case_number && <p className="text-xs text-gray-400 mt-0.5">#{c.case_number} {c.court ? `· ${c.court}` : ""}</p>}
                    </td>
                    <td className="tcell text-gray-600">{c.client_id ? (clientMap[c.client_id] ?? <span className="text-gray-300">—</span>) : <span className="text-gray-300">—</span>}</td>
                    <td className="tcell"><CaseStatusBadge status={c.status} /></td>
                    <td className="tcell text-gray-500">{formatDate(c.next_hearing_date)}</td>
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
