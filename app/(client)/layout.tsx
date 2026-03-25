import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/Sidebar";

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("profiles").select("full_name, role").eq("id", user.id).maybeSingle();

  if (profile?.role !== "client") redirect("/auth");

  return (
    <div className="flex min-h-screen flex-col bg-[#f3f5f9] lg:h-screen lg:overflow-hidden lg:flex-row">
      <Sidebar fullName={profile.full_name} role="client" />
      <main className="min-w-0 flex-1 overflow-auto lg:h-screen lg:overflow-y-auto">{children}</main>
    </div>
  );
}
