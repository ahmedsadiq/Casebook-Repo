import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatDate, formatCurrency, formatFileSize } from "@/lib/utils";
import { CaseStatusBadge, PaymentStatusBadge } from "@/components/StatusBadge";
import DeleteCaseButton from "./DeleteCaseButton";
import ManageAssociatesPanel from "./ManageAssociatesPanel";

export default async function CaseDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [
    { data: c },
    { data: updates },
    { data: payments },
    { data: docs },
    { data: allAssociates },
    { data: assignedRows },
  ] = await Promise.all([
    supabase.from("cases")
      .select("*")
      .eq("id", params.id).eq("advocate_id", user!.id).single(),
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

  if (!c) notFound();

  // Fetch client profile separately to avoid FK-join failures in production
  const { data: clientProfile } = c.client_id
    ? await supabase.from("profiles").select("id,full_name,email,phone").eq("id", c.client_id).single()
    : { data: null };

  type ClientRow    = { id: string; full_name: string | null; email: string | null; phone: string | null };
  type AuthorRow    = { full_name: string | null; role: string };
  type UploaderRow  = { full_name: string | null };
  type AssociateRow = { id: string; full_name: string | null; email: string | null };

  const client = clientProfile as ClientRow | null;
  const totalDue = payments?.filter(p => p.status !== "paid").reduce((s, p) => s + p.amount, 0) ?? 0;

  const assigned: AssociateRow[] = (assignedRows ?? []).map(row => {
    const p = row.profiles as unknown as AssociateRow | null;
    return p ?? { id: row.associate_id, full_name: null, email: null };
  });

  return (
    <div className="pg-wrap">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link href="/advocate/cases" className="text-sm text-gray-400 hover:text-gray-600 mb-1.5 inline-block">← Cases</Link>
          <h1 className="text-xl font-semibold text-gray-900">{c.title}</h1>
          <div className="flex items-center gap-2.5 mt-2 flex-wrap">
            <CaseStatusBadge status={c.status} />
            {c.case_number && <span className="text-sm text-gray-400">#{c.case_number}</span>}
            {c.court && <span className="text-sm text-gray-400">· {c.court}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <Link href={`/advocate/cases/${c.id}/edit`} className="btn-secondary btn-sm">Edit</Link>
          <Link href={`/advocate/cases/${c.id}/updates`} className="btn-primary btn-sm">+ Update</Link>
          <DeleteCaseButton caseId={c.id} caseTitle={c.title} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main column */}
        <div className="col-span-2 space-y-6">
          {/* Details */}
          <div className="card">
            <div className="card-header"><h2 className="text-sm font-semibold text-gray-700">Case Details</h2></div>
            <div className="card-body grid grid-cols-2 gap-5 text-sm">
              <div>
                <p className="text-xs text-gray-400 mb-0.5 font-medium uppercase tracking-wide">Next Hearing</p>
                <p className="font-semibold text-gray-900">{formatDate(c.next_hearing_date)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5 font-medium uppercase tracking-wide">Last Updated</p>
                <p className="text-gray-700">{formatDate(c.updated_at)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5 font-medium uppercase tracking-wide">Filed</p>
                <p className="text-gray-700">{formatDate(c.created_at)}</p>
              </div>
              {c.description && (
                <div className="col-span-2 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wide">Notes</p>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{c.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Updates */}
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
                    <div key={u.id} className="px-6 py-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-gray-800">{author?.full_name ?? "Unknown"}</span>
                        <span className={author?.role === "advocate" ? "role-advocate" : "role-associate"}>{author?.role}</span>
                        <span className="text-xs text-gray-400 ml-auto">{formatDate(u.created_at)}</span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{u.content}</p>
                      {u.hearing_date && (
                        <p className="text-xs text-navy-600 mt-1.5 font-medium flex items-center gap-1">
                          <span>📅</span> Next hearing: {formatDate(u.hearing_date)}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Documents */}
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
                    <div key={d.id} className="px-6 py-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">📄</span>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{d.name}</p>
                          <p className="text-xs text-gray-400">{uploader?.full_name} · {formatDate(d.created_at)} {d.size_bytes ? `· ${formatFileSize(d.size_bytes)}` : ""}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-5">
          {/* Client card */}
          <div className="card">
            <div className="card-header"><h2 className="text-sm font-semibold text-gray-700">Client</h2></div>
            <div className="card-body text-sm">
              {!client ? (
                <p className="text-gray-400">No client assigned.</p>
              ) : (
                <div className="space-y-2">
                  <p className="font-semibold text-gray-900">{client.full_name ?? "—"}</p>
                  {client.email && <p className="text-gray-500">{client.email}</p>}
                  {client.phone && <p className="text-gray-500">{client.phone}</p>}
                  <Link href={`/advocate/clients`} className="text-xs text-navy-600 hover:underline block mt-2">View all clients →</Link>
                </div>
              )}
            </div>
          </div>

          {/* Assigned Associates */}
          <ManageAssociatesPanel
            caseId={c.id}
            allAssociates={allAssociates ?? []}
            assigned={assigned}
          />

          {/* Payments */}
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
                  <div key={p.id} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{p.description}</p>
                      <p className="text-xs text-gray-400">Due: {formatDate(p.due_date)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">{formatCurrency(p.amount)}</p>
                      <PaymentStatusBadge status={p.status} />
                    </div>
                  </div>
                ))}
                {totalDue > 0 && (
                  <div className="px-4 py-3 bg-amber-50/50 flex items-center justify-between">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Outstanding</p>
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
