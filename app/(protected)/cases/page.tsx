import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import CasesFilter from "./CasesFilter";
import type { CaseStatus } from "@/lib/supabase/types";

interface PageProps {
  searchParams: { q?: string; status?: string };
}

export default async function CasesPage({ searchParams }: PageProps) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase
    .from("cases")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  const validStatuses: CaseStatus[] = ["open", "pending", "closed"];
  if (searchParams.status && validStatuses.includes(searchParams.status as CaseStatus)) {
    query = query.eq("status", searchParams.status);
  }
  if (searchParams.q) {
    query = query.ilike("title", `%${searchParams.q}%`);
  }

  const { data: cases } = await query;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cases</h1>
          <p className="text-gray-500 text-sm mt-1">{cases?.length ?? 0} case{cases?.length !== 1 ? "s" : ""}</p>
        </div>
        <Link href="/cases/new" className="btn-primary">
          + New Case
        </Link>
      </div>

      <CasesFilter initialQ={searchParams.q ?? ""} initialStatus={searchParams.status ?? ""} />

      <div className="card mt-4">
        {!cases || cases.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-gray-400 text-sm">
              {searchParams.q || searchParams.status ? "No cases match your filters." : "No cases yet."}
            </p>
            {!searchParams.q && !searchParams.status && (
              <Link href="/cases/new" className="btn-primary btn-sm mt-4 inline-flex">
                Create your first case
              </Link>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Title</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Created</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cases.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <Link href={`/cases/${c.id}`} className="text-sm font-medium text-gray-900 hover:text-primary-700">
                      {c.title}
                    </Link>
                    {c.description && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{c.description}</p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{formatDate(c.created_at)}</td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/cases/${c.id}/edit`} className="btn-secondary btn-sm">
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "open" ? "badge-open" : status === "pending" ? "badge-pending" : "badge-closed";
  return <span className={cls}>{status}</span>;
}
