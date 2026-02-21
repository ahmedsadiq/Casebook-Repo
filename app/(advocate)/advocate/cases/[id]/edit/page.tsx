import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import CaseForm from "../../CaseForm";

export const metadata = { title: "Edit Case" };

export default async function EditCasePage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: c }, { data: clients }] = await Promise.all([
    supabase.from("cases").select("*").eq("id", params.id).eq("advocate_id", user!.id).single(),
    supabase.from("profiles").select("id,full_name").eq("advocate_id", user!.id).eq("role", "client").order("full_name"),
  ]);

  if (!c) notFound();

  return (
    <div className="pg-wrap max-w-2xl">
      <div className="mb-6">
        <Link href={`/advocate/cases/${c.id}`} className="text-sm text-gray-400 hover:text-gray-600 mb-1.5 inline-block">← Back to Case</Link>
        <h1 className="pg-title">Edit Case</h1>
      </div>
      <div className="card p-7">
        <CaseForm mode="edit" existingCase={c} clients={clients ?? []} />
      </div>
    </div>
  );
}
