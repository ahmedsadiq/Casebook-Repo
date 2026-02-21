import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { CaseStatusBadge } from "@/components/StatusBadge";

export const metadata = { title: "Cases" };

export default async function AssociateCasesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles").select("advocate_id").eq("id", user!.id).single();

  const { data: cases } = await supabase
    .from("cases")
    .select("id,title,status,case_number,court,next_hearing_date,created_at,profiles!cases_client_id_fkey(full_name)")
    .eq("advocate_id", profile!.advocate_id!)
    .order("updated_at", { ascending: false });

  return (
    <div className="pg-wrap">
      <div className="pg-head">
        <div>
          <h1 className="pg-title">Cases</h1>
          <p className="pg-sub">{cases?.length ?? 0} cases</p>
        </div>
      </div>
      <div className="card">
        {!cases?.length ? (
          <div className="py-16 text-center text-sm text-gray-400">No cases found.</div>
        ) : (
          <table className="w-full">
            <thead><tr className="thead"><th>Case</th><th>Client</th><th>Status</th><th>Next Hearing</th></tr></thead>
            <tbody>
              {cases.map(c => {
                const client = c.profiles as unknown as { full_name: string | null } | null;
                return (
                  <tr key={c.id} className="trow">
                    <td className="tcell">
                      <Link href={`/associate/cases/${c.id}`} className="font-medium text-gray-900 hover:text-navy-700">{c.title}</Link>
                      {c.case_number && <p className="text-xs text-gray-400 mt-0.5">#{c.case_number} {c.court ? `· ${c.court}` : ""}</p>}
                    </td>
                    <td className="tcell text-gray-600">{client?.full_name ?? <span className="text-gray-300">—</span>}</td>
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
