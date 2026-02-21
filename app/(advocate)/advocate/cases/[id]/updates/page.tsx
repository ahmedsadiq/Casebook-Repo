import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import AddUpdateForm from "./AddUpdateForm";

export const metadata = { title: "Add Update" };

export default async function AddUpdatePage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: c } = await supabase.from("cases").select("id,title,status")
    .eq("id", params.id).eq("advocate_id", user!.id).single();

  if (!c) notFound();

  return (
    <div className="pg-wrap max-w-2xl">
      <div className="mb-6">
        <Link href={`/advocate/cases/${c.id}`} className="text-sm text-gray-400 hover:text-gray-600 mb-1.5 inline-block">← {c.title}</Link>
        <h1 className="pg-title">Add Case Update</h1>
        <p className="pg-sub">Log progress, update the hearing date, or upload a document</p>
      </div>
      <div className="card p-7">
        <AddUpdateForm caseId={c.id} currentStatus={c.status} redirectPath={`/advocate/cases/${c.id}`} />
      </div>
    </div>
  );
}
