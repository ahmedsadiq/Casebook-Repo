import { createClient } from "@/lib/supabase/server";
import CaseForm from "../CaseForm";
import Link from "next/link";

export const metadata = { title: "New Case" };

export default async function NewCasePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: clients } = await supabase
    .from("profiles")
    .select("id,full_name")
    .eq("advocate_id", user!.id)
    .eq("role", "client")
    .order("full_name");

  return (
    <div className="pg-wrap max-w-2xl">
      <div className="mb-6">
        <Link href="/advocate/cases" className="text-sm text-gray-400 hover:text-gray-600 mb-1.5 inline-block">← Cases</Link>
        <h1 className="pg-title">New Case</h1>
        <p className="pg-sub">Create a new case file</p>
      </div>
      <div className="card p-7">
        <CaseForm mode="create" clients={clients ?? []} />
      </div>
    </div>
  );
}
