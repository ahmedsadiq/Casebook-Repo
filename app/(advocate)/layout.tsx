import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/Sidebar";

export default async function AdvocateLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) redirect("/auth");

  const { data: profile, error: profileError } = await supabase
    .from("profiles").select("full_name, role").eq("id", user.id).single();

  if (profileError) {
    throw new Error(`Failed to load profile: ${profileError.message}`);
  }

  if (profile?.role !== "advocate") redirect("/auth");

  return (
    <div className="flex min-h-screen bg-[#f3f5f9]">
      <Sidebar fullName={profile.full_name} role="advocate" />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
