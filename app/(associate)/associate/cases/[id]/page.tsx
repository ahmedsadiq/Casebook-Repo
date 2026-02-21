import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { CaseStatusBadge } from "@/components/StatusBadge";
import AddUpdateForm from "@/app/(advocate)/advocate/cases/[id]/updates/AddUpdateForm";

export default async function AssociateCaseDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles").select("advocate_id").eq("id", user!.id).single();

  const [{ data: c }, { data: updates }, { data: docs }] = await Promise.all([
    supabase.from("cases")
      .select("*,profiles!cases_client_id_fkey(full_name,email,phone)")
      .eq("id", params.id).eq("advocate_id", profile!.advocate_id!).single(),
    supabase.from("case_updates")
      .select("*,profiles!case_updates_author_id_fkey(full_name,role)")
      .eq("case_id", params.id).order("created_at", { ascending: false }),
    supabase.from("case_documents")
      .select("*,profiles!case_documents_uploader_id_fkey(full_name)")
      .eq("case_id", params.id).order("created_at", { ascending: false }),
  ]);

  if (!c) notFound();

  type AuthorRow = { full_name: string | null; role: string };
  const client = c.profiles as unknown as { full_name: string | null; email: string | null; phone: string | null } | null;

  return (
    <div className="pg-wrap">
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link href="/associate/cases" className="text-sm text-gray-400 hover:text-gray-600 mb-1.5 inline-block">← Cases</Link>
          <h1 className="text-xl font-semibold text-gray-900">{c.title}</h1>
          <div className="flex items-center gap-2.5 mt-2 flex-wrap">
            <CaseStatusBadge status={c.status} />
            {c.case_number && <span className="text-sm text-gray-400">#{c.case_number}</span>}
            {c.court && <span className="text-sm text-gray-400">· {c.court}</span>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          {/* Case info */}
          <div className="card">
            <div className="card-header"><h2 className="text-sm font-semibold text-gray-700">Details</h2></div>
            <div className="card-body grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-0.5">Next Hearing</p>
                <p className="font-semibold text-navy-700">{formatDate(c.next_hearing_date)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-0.5">Filed</p>
                <p className="text-gray-700">{formatDate(c.created_at)}</p>
              </div>
              {c.description && (
                <div className="col-span-2 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-1.5">Notes</p>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{c.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Add update */}
          <div className="card">
            <div className="card-header"><h2 className="text-sm font-semibold text-gray-700">Add Update</h2></div>
            <div className="card-body">
              <AddUpdateForm caseId={c.id} currentStatus={c.status} redirectPath={`/associate/cases/${c.id}`} />
            </div>
          </div>

          {/* Updates history */}
          <div className="card">
            <div className="card-header"><h2 className="text-sm font-semibold text-gray-700">Update History</h2></div>
            {!updates?.length ? (
              <div className="py-10 text-center text-sm text-gray-400">No updates yet.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {updates.map(u => {
                  const author = u.profiles as unknown as AuthorRow | null;
                  return (
                    <div key={u.id} className="px-6 py-4">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-sm font-medium text-gray-800">{author?.full_name ?? "Unknown"}</span>
                        <span className={author?.role === "advocate" ? "role-advocate" : "role-associate"}>{author?.role}</span>
                        <span className="text-xs text-gray-400 ml-auto">{formatDate(u.created_at)}</span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{u.content}</p>
                      {u.hearing_date && (
                        <p className="text-xs text-navy-600 mt-1.5 font-medium">📅 Next hearing: {formatDate(u.hearing_date)}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: client */}
        <div className="space-y-5">
          <div className="card">
            <div className="card-header"><h2 className="text-sm font-semibold text-gray-700">Client</h2></div>
            <div className="card-body text-sm">
              {!client ? <p className="text-gray-400">No client assigned.</p> : (
                <div className="space-y-1.5">
                  <p className="font-semibold text-gray-900">{client.full_name ?? "—"}</p>
                  {client.email && <p className="text-gray-500">{client.email}</p>}
                  {client.phone && <p className="text-gray-500">{client.phone}</p>}
                </div>
              )}
            </div>
          </div>
          {docs && docs.length > 0 && (
            <div className="card">
              <div className="card-header"><h2 className="text-sm font-semibold text-gray-700">Documents</h2></div>
              <div className="divide-y divide-gray-100">
                {docs.map(d => (
                  <div key={d.id} className="px-4 py-3 flex items-center gap-2">
                    <span>📄</span>
                    <span className="text-sm text-gray-700 truncate">{d.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
