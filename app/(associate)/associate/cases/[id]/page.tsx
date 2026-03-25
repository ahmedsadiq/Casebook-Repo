import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatDate, isDateUpdateRequired, normalizeCaseStatus } from "@/lib/utils";
import { CaseStatusBadge } from "@/components/StatusBadge";
import AddUpdateForm from "@/app/(advocate)/advocate/cases/[id]/updates/AddUpdateForm";

export default async function AssociateCaseDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const [{ data: rawCase }, { data: updates }, { data: docs }] = await Promise.all([
    supabase.from("cases")
      .select("*")
      .eq("id", params.id).single(),
    supabase.from("case_updates")
      .select("*,profiles!case_updates_author_id_fkey(full_name,role)")
      .eq("case_id", params.id).order("created_at", { ascending: false }),
    supabase.from("case_documents")
      .select("*,profiles!case_documents_uploader_id_fkey(full_name)")
      .eq("case_id", params.id).order("created_at", { ascending: false }),
  ]);

  if (!rawCase) notFound();

  const c = {
    ...rawCase,
    status: normalizeCaseStatus(rawCase.status),
    needs_date_update: isDateUpdateRequired(rawCase.next_hearing_date),
  };

  const { data: clientProfile } = c.client_id
    ? await supabase.from("profiles").select("full_name,email,phone").eq("id", c.client_id).single()
    : { data: null };

  type AuthorRow = { full_name: string | null; role: string };
  const client = clientProfile as { full_name: string | null; email: string | null; phone: string | null } | null;

  return (
    <div className="pg-wrap">
      <div className="mb-6 flex flex-col gap-4">
        <div>
          <Link href="/associate/cases" className="mb-1.5 inline-block text-sm text-gray-400 hover:text-gray-600">← Cases</Link>
          <h1 className="text-xl font-semibold text-gray-900">{c.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2.5">
            <CaseStatusBadge status={c.status} />
            {c.case_number && <span className="text-sm text-gray-400">#{c.case_number}</span>}
            {c.court && <span className="text-sm text-gray-400">· {c.court}</span>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <div className="card">
            <div className="card-header"><h2 className="text-sm font-semibold text-gray-700">Details</h2></div>
            <div className="card-body grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <div>
                <p className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-gray-400">Next Hearing</p>
                <p className={c.needs_date_update ? "font-semibold text-red-600" : "font-semibold text-navy-700"}>
                  {formatDate(c.next_hearing_date)}
                </p>
              </div>
              <div>
                <p className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-gray-400">Last Hearing</p>
                <p className="text-gray-700">{formatDate(c.last_hearing_date)}</p>
              </div>
              {c.needs_date_update && (
                <div className="sm:col-span-2">
                  <span className="inline-flex rounded bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">
                    Action Required - Date Not Updated
                  </span>
                </div>
              )}
              <div>
                <p className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-gray-400">Filed</p>
                <p className="text-gray-700">{formatDate(c.created_at)}</p>
              </div>
              {c.description && (
                <div className="border-t border-gray-100 pt-3 sm:col-span-2">
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">Notes</p>
                  <p className="whitespace-pre-wrap leading-relaxed text-gray-700">{c.description}</p>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h2 className="text-sm font-semibold text-gray-700">Add Update</h2></div>
            <div className="card-body">
              <AddUpdateForm caseId={c.id} currentStatus={c.status} redirectPath={`/associate/cases/${c.id}`} />
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h2 className="text-sm font-semibold text-gray-700">Update History</h2></div>
            {!updates?.length ? (
              <div className="py-10 text-center text-sm text-gray-400">No updates yet.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {updates.map(u => {
                  const author = u.profiles as unknown as AuthorRow | null;
                  return (
                    <div key={u.id} className="px-4 py-4 sm:px-6">
                      <div className="mb-1.5 flex flex-col gap-2 sm:flex-row sm:items-center">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-gray-800">{author?.full_name ?? "Unknown"}</span>
                          <span className={author?.role === "advocate" ? "role-advocate" : "role-associate"}>{author?.role}</span>
                        </div>
                        <span className="text-xs text-gray-400 sm:ml-auto">{formatDate(u.created_at)}</span>
                      </div>
                      <p className="text-sm leading-relaxed text-gray-700">{u.content}</p>
                      {u.hearing_date && (
                        <p className="mt-1.5 text-xs font-medium text-navy-600">Next hearing: {formatDate(u.hearing_date)}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="card">
            <div className="card-header"><h2 className="text-sm font-semibold text-gray-700">Client</h2></div>
            <div className="card-body text-sm">
              {!client ? <p className="text-gray-400">No client assigned.</p> : (
                <div className="space-y-1.5">
                  <p className="font-semibold text-gray-900">{client.full_name ?? "—"}</p>
                  {client.email && <p className="break-words text-gray-500">{client.email}</p>}
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
                  <div key={d.id} className="flex items-center gap-2 px-4 py-3">
                    <span>📄</span>
                    <span className="truncate text-sm text-gray-700">{d.name}</span>
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
