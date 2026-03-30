import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatDate, formatCurrency, formatFileSize, isDateUpdateRequired, normalizeCaseStatus } from "@/lib/utils";
import { CaseStatusBadge, PaymentStatusBadge } from "@/components/StatusBadge";
import DeleteCaseButton from "./DeleteCaseButton";
import ManageAssociatesPanel from "./ManageAssociatesPanel";
import DocumentUploadButton from "./DocumentUploadButton";
import AssignClientControl from "../AssignClientControl";

export default async function CaseDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [
    { data: rawCase },
    { data: updates },
    { data: payments },
    { data: docs },
    { data: linkedTasks },
    { data: allClients },
    { data: allAssociates },
    { data: assignedRows },
  ] = await Promise.all([
    supabase.from("cases").select("*").eq("id", params.id).eq("advocate_id", user!.id).single(),
    supabase.from("case_updates")
      .select("*,profiles!case_updates_author_id_fkey(full_name,role)")
      .eq("case_id", params.id)
      .order("created_at", { ascending: false }),
    supabase.from("payments")
      .select("*")
      .eq("case_id", params.id)
      .order("due_date", { ascending: true }),
    supabase.from("case_documents")
      .select("*,profiles!case_documents_uploader_id_fkey(full_name)")
      .eq("case_id", params.id)
      .order("created_at", { ascending: false }),
    supabase.from("tasks")
      .select("id,title,due_date,completed,created_at")
      .eq("user_id", user!.id)
      .eq("case_id", params.id)
      .order("completed", { ascending: true })
      .order("due_date", { ascending: true, nullsFirst: false }),
    supabase.from("profiles")
      .select("id,full_name,email")
      .eq("advocate_id", user!.id)
      .eq("role", "client")
      .order("full_name"),
    supabase.from("profiles")
      .select("id,full_name,email")
      .eq("advocate_id", user!.id)
      .eq("role", "associate")
      .order("full_name"),
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
  const totalDue = payments?.filter((payment) => payment.status !== "paid").reduce((sum, payment) => sum + payment.amount, 0) ?? 0;

  const assigned: AssociateRow[] = (assignedRows ?? []).map((row) => {
    const profile = row.profiles as unknown as AssociateRow | null;
    return profile ?? { id: row.associate_id, full_name: null, email: null };
  });
  const associateActivity = (updates ?? [])
    .filter((update) => {
      const author = update.profiles as unknown as AuthorRow | null;
      return author?.role === "associate";
    })
    .slice(0, 4);

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
          <Link href={{ pathname: "/advocate/dashboard", query: { taskCaseId: c.id } }} className="btn-secondary btn-sm">Add task</Link>
          <Link
            href={{
              pathname: "/advocate/ask-expert",
              query: {
                caseId: c.id,
                title: c.title,
                status: c.status,
                court: c.court ?? "",
                nextHearingDate: c.next_hearing_date ?? "",
              },
            }}
            className="btn-secondary btn-sm"
          >
            Ask about this case
          </Link>
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
                {updates.map((update) => {
                  const author = update.profiles as unknown as AuthorRow | null;
                  return (
                    <div key={update.id} className="px-4 py-4 sm:px-6">
                      <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-gray-800">{author?.full_name ?? "Unknown"}</span>
                          <span className={author?.role === "advocate" ? "role-advocate" : "role-associate"}>{author?.role}</span>
                        </div>
                        <span className="text-xs text-gray-400 sm:ml-auto">{formatDate(update.created_at)}</span>
                      </div>
                      <p className="text-sm leading-relaxed text-gray-700">{update.content}</p>
                      {update.hearing_date && (
                        <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-navy-600">
                          <span>Next hearing:</span> {formatDate(update.hearing_date)}
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
              <DocumentUploadButton caseId={c.id} />
            </div>
            {!docs?.length ? (
              <div className="py-10 text-center text-sm text-gray-400">No documents uploaded.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {docs.map((doc) => {
                  const uploader = doc.profiles as unknown as UploaderRow | null;
                  return (
                    <div key={doc.id} className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="text-xl">File</span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-800">{doc.name}</p>
                          <p className="text-xs text-gray-400">
                            {uploader?.full_name} · {formatDate(doc.created_at)} {doc.size_bytes ? `· ${formatFileSize(doc.size_bytes)}` : ""}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="text-sm font-semibold text-gray-700">Linked Tasks</h2>
              <Link href={{ pathname: "/advocate/dashboard", query: { taskCaseId: c.id } }} className="btn-secondary btn-sm">
                Manage tasks
              </Link>
            </div>
            {!linkedTasks?.length ? (
              <div className="py-10 text-center text-sm text-gray-400">No tasks linked to this case yet.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {linkedTasks.map((task) => (
                  <div key={task.id} className="flex flex-col gap-2 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <div>
                      <p className={`text-sm font-medium ${task.completed ? "text-gray-400 line-through" : "text-gray-800"}`}>{task.title}</p>
                      <p className="text-xs text-gray-400">
                        {task.due_date ? `Due ${formatDate(task.due_date)}` : "No due date"}
                      </p>
                    </div>
                    <span className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${
                      task.completed ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                    }`}>
                      {task.completed ? "Completed" : "Open"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="card">
            <div className="card-header"><h2 className="text-sm font-semibold text-gray-700">Client</h2></div>
            <div className="card-body text-sm">
              {!client ? (
                <div className="space-y-3">
                  <p className="text-gray-400">No client assigned yet. Link a client here so this case is easier to track.</p>
                  <AssignClientControl
                    caseId={c.id}
                    currentClientId={c.client_id}
                    clients={allClients ?? []}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="font-semibold text-gray-900">{client.full_name ?? "-"}</p>
                  {client.email && <p className="break-words text-gray-500">{client.email}</p>}
                  {client.phone && <p className="text-gray-500">{client.phone}</p>}
                  <AssignClientControl
                    caseId={c.id}
                    currentClientId={c.client_id}
                    clients={allClients ?? []}
                  />
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
              <h2 className="text-sm font-semibold text-gray-700">Recent Associate Activity</h2>
              <span className="text-xs text-gray-400">{associateActivity.length} update{associateActivity.length !== 1 ? "s" : ""}</span>
            </div>
            {!associateActivity.length ? (
              <div className="card-body text-sm text-gray-400">No associate updates on this case yet.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {associateActivity.map((update) => {
                  const author = update.profiles as unknown as AuthorRow | null;
                  const preview = update.content.length > 120 ? `${update.content.slice(0, 120)}...` : update.content;

                  return (
                    <div key={update.id} className="px-4 py-3.5">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm font-medium text-gray-900">{author?.full_name ?? "Associate"}</p>
                        <span className="text-xs text-gray-400">{formatDate(update.created_at)}</span>
                      </div>
                      <p className="mt-1 text-sm leading-6 text-gray-600">{preview}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="text-sm font-semibold text-gray-700">Payments</h2>
              <Link href={`/advocate/cases/${c.id}/payments`} className="btn-secondary btn-sm">Manage</Link>
            </div>
            {!payments?.length ? (
              <div className="card-body text-sm text-gray-400">No payment records.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{payment.description}</p>
                      <p className="text-xs text-gray-400">Due: {formatDate(payment.due_date)}</p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-sm font-semibold text-gray-900">{formatCurrency(payment.amount)}</p>
                      <PaymentStatusBadge status={payment.status} />
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
