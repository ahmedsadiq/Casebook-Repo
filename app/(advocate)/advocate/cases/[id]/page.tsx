import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatDate, formatCurrency, formatFileSize, isDateUpdateRequired, normalizeCaseStatus } from "@/lib/utils";
import { CaseStatusBadge, PaymentStatusBadge } from "@/components/StatusBadge";
import DeleteCaseButton from "./DeleteCaseButton";
import ManageAssociatesPanel from "./ManageAssociatesPanel";

export default async function CaseDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [
    { data: rawCase },
    { data: updates },
    { data: payments },
    { data: docs },
    { data: allAssociates },
    { data: assignedRows },
  ] = await Promise.all([
    supabase.from("cases").select("*").eq("id", params.id).eq("advocate_id", user!.id).single(),
    supabase.from("case_updates")
      .select("*,profiles!case_updates_author_id_fkey(full_name,role)")
      .eq("case_id", params.id).order("created_at", { ascending: false }),
    supabase.from("payments")
      .select("*").eq("case_id", params.id).order("due_date", { ascending: true }),
    supabase.from("case_documents")
      .select("*,profiles!case_documents_uploader_id_fkey(full_name)")
      .eq("case_id", params.id).order("created_at", { ascending: false }),
    supabase.from("profiles")
      .select("id,full_name,email")
      .eq("advocate_id", user!.id).eq("role", "associate").order("full_name"),
    supabase.from("case_associates")
      .select("associate_id, profiles!case_associates_associate_id_fkey(id,full_name,email)")
      .eq("case_id", params.id),
  ]);

  if (!rawCase) notFound();

  const c = {
    ...rawCase,
    status: normalizeCaseStatus(rawCase.status),
    needs_date_update: isDateUpdateRequired(rawCase.next_hearing_date),
  };

  const { data: clientProfile } = c.client_id
    ? await supabase.from("profiles").select("id,full_name,email,phone").eq("id", c.client_id).single()
    : { data: null };

  type ClientRow = { id: string; full_name: string | null; email: string | null; phone: string | null };
  type AuthorRow = { full_name: string | null; role: string };
  type UploaderRow = { full_name: string | null };
  type AssociateRow = { id: string; full_name: string | null; email: string | null };

  const client = clientProfile as ClientRow | null;
  const totalDue = payments?.filter(p => p.status !== "paid").reduce((s, p) => s + p.amount, 0) ?? 0;

  const assigned: AssociateRow[] = (assignedRows ?? []).map(row => {
    const p = row.profiles as unknown as AssociateRow | null;
    return p ?? { id: row.associate_id, full_name: null, email: null };
  });

  return (
    <div className="pg-wrap">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link href="/advocate/cases" className="mb-1.5 inline-block text-sm text-gray-400 hover:text-gray-600">← Cases</Link>
          <h1 className="text-xl font-semibold text-gray-900">{c.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2.5">
            <CaseStatusBadge status={c.status} />
            {c.case_number && <span className="text-sm text-gray-400">#{c.case_number}</span>}
            {c.court && <span className="text-sm text-gray-400">· {c.court}</span>}
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link href={`/advocate/cases/${c.id}/edit`} className="btn-secondary btn-sm">Edit</Link>
          <Link href={`/advocate/cases/${c.id}/updates`} className="btn-primary btn-sm">+ Update</Link>
          <DeleteCaseButton caseId={c.id} caseTitle={c.title} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <div className="card">
            <div className="card-header"><h2 className="text-sm font-semibold text-gray-700">Case Details</h2></div>
            <div className="card-body grid grid-cols-1 gap-5 text-sm sm:grid-cols-2">
              <div>
                <p className="mb-0.5 text-xs font-medium uppercase tracking-wide text-gray-400">Next Hearing</p>
                <p className={c.needs_date_update ? "font-semibold text-red-600" : "font-semibold text-gray-900"}>
                  {formatDate(c.next_hearing_date)}
                </p>
              </div>
              <div>
                <p className="mb-0.5 text-xs font-medium uppercase tracking-wide text-gray-400">Last Hearing</p>
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
                <p className="mb-0.5 text-xs font-medium uppercase tracking-wide text-gray-400">Last Updated</p>
                <p className="text-gray-700">{formatDate(c.updated_at)}</p>
              </div>
              <div>
                <p className="mb-0.5 text-xs font-medium uppercase tracking-wide text-gray-400">Filed</p>
                <p className="text-gray-700">{formatDate(c.created_at)}</p>
              </div>
              {c.description && (
                <div className="border-t border-gray-100 pt-3 sm:col-span-2">
                  <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-gray-400">Notes</p>
                  <p className="whitespace-pre-wrap leading-relaxed text-gray-700">{c.description}</p>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="text-sm font-semibold text-gray-700">Case Updates</h2>
              <Link href={`/advocate/cases/${c.id}/updates`} className="btn-secondary btn-sm">+ Add Update</Link>
            </div>
            {!updates?.length ? (
              <div className="py-10 text-center text-sm text-gray-400">No updates yet.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {updates.map(u => {
                  const author = u.profiles as unknown as AuthorRow | null;
                  return (
                    <div key={u.id} className="px-4 py-4 sm:px-6">
                      <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-gray-800">{author?.full_name ?? "Unknown"}</span>
                          <span className={author?.role === "advocate" ? "role-advocate" : "role-associate"}>{author?.role}</span>
                        </div>
                        <span className="text-xs text-gray-400 sm:ml-auto">{formatDate(u.created_at)}</span>
                      </div>
                      <p className="text-sm leading-relaxed text-gray-700">{u.content}</p>
                      {u.hearing_date && (
                        <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-navy-600">
                          <span>Next hearing:</span> {formatDate(u.hearing_date)}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="text-sm font-semibold text-gray-700">Documents</h2>
              <Link href={`/advocate/cases/${c.id}/updates`} className="btn-secondary btn-sm">+ Upload</Link>
            </div>
            {!docs?.length ? (
              <div className="py-10 text-center text-sm text-gray-400">No documents uploaded.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {docs.map(d => {
                  const uploader = d.profiles as unknown as UploaderRow | null;
                  return (
                    <div key={d.id} className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="text-xl">📄</span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-800">{d.name}</p>
                          <p className="text-xs text-gray-400">
                            {uploader?.full_name} · {formatDate(d.created_at)} {d.size_bytes ? `· ${formatFileSize(d.size_bytes)}` : ""}
                          </p>
                        </div>
                      </div>
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
              {!client ? (
                <p className="text-gray-400">No client assigned.</p>
              ) : (
                <div className="space-y-2">
                  <p className="font-semibold text-gray-900">{client.full_name ?? "—"}</p>
                  {client.email && <p className="break-words text-gray-500">{client.email}</p>}
                  {client.phone && <p className="text-gray-500">{client.phone}</p>}
                  <Link href="/advocate/clients" className="mt-2 block text-xs text-navy-600 hover:underline">View all clients →</Link>
                </div>
              )}
            </div>
          </div>

          <ManageAssociatesPanel
            caseId={c.id}
            allAssociates={allAssociates ?? []}
            assigned={assigned}
          />

          <div className="card">
            <div className="card-header">
              <h2 className="text-sm font-semibold text-gray-700">Payments</h2>
              <Link href={`/advocate/cases/${c.id}/payments`} className="btn-secondary btn-sm">Manage</Link>
            </div>
            {!payments?.length ? (
              <div className="card-body text-sm text-gray-400">No payment records.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {payments.map(p => (
                  <div key={p.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{p.description}</p>
                      <p className="text-xs text-gray-400">Due: {formatDate(p.due_date)}</p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-sm font-semibold text-gray-900">{formatCurrency(p.amount)}</p>
                      <PaymentStatusBadge status={p.status} />
                    </div>
                  </div>
                ))}
                {totalDue > 0 && (
                  <div className="flex items-center justify-between bg-amber-50/50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Outstanding</p>
                    <p className="text-sm font-bold text-amber-600">{formatCurrency(totalDue)}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
