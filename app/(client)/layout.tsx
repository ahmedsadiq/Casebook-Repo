import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/Sidebar";

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("profiles").select("full_name, role").eq("id", user.id).single();

  if (profile?.role !== "client") redirect("/auth");

  return (
    <div className="flex min-h-screen bg-[#f3f5f9]">
      <Sidebar fullName={profile.full_name} role="client" />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
