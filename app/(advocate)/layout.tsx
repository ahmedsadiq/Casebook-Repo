import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/Sidebar";
import { isAdvocateSubscriptionActive } from "@/lib/advocate-subscription";

export default async function AdvocateLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) redirect("/auth");

  let { data: profile, error: profileError } = await supabase
    .from("profiles").select("full_name, role").eq("id", user.id).maybeSingle();

  if (profileError) {
    throw new Error(`Failed to load profile: ${profileError.message}`);
  }

  if (!profile) {
    const { error: insertError } = await supabase.from("profiles").insert({
      id: user.id,
      email: user.email ?? null,
      full_name: typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null,
      role: "advocate",
    });
    if (insertError) throw new Error(`Failed to create profile: ${insertError.message}`);

    const { data: createdProfile, error: createdProfileError } = await supabase
      .from("profiles").select("full_name, role").eq("id", user.id).maybeSingle();
    if (createdProfileError) throw new Error(`Failed to load profile: ${createdProfileError.message}`);
    profile = createdProfile;
  }

  if (profile?.role !== "advocate") redirect("/auth");

  const { data: subscription } = await supabase
    .from("advocate_subscriptions")
    .select("status")
    .eq("advocate_id", user.id)
    .maybeSingle();

  if (subscription && !isAdvocateSubscriptionActive(subscription.status)) {
    redirect("/billing");
  }

  return (
    <div className="flex min-h-screen bg-[#f3f5f9]">
      <Sidebar fullName={profile.full_name} role="advocate" />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
