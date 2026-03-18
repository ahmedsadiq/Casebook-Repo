import { createClient } from "@/lib/supabase/server";
import ProfileForm from "@/app/(advocate)/advocate/profile/ProfileForm";
import ProfileSummaryCard from "@/components/ProfileSummaryCard";

export const metadata = { title: "Profile" };

export default async function AssociateProfilePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name,email,phone,avatar_url,office_address")
    .eq("id", user!.id)
    .single();

  return (
    <div className="pg-wrap max-w-3xl">
      <div className="mb-6">
        <h1 className="pg-title">Profile</h1>
        <p className="pg-sub">Your account details</p>
      </div>
      <ProfileSummaryCard
        fullName={profile?.full_name ?? "Associate"}
        email={user!.email ?? profile?.email ?? ""}
        phone={profile?.phone ?? ""}
        avatarUrl={profile?.avatar_url ?? ""}
        officeAddress={profile?.office_address ?? ""}
      />
      <div className="card p-7">
        <div className="mb-5 pb-5 border-b border-gray-100">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-0.5">Email</p>
          <p className="text-sm text-gray-900">{user!.email}</p>
        </div>
        <ProfileForm
          fullName={profile?.full_name ?? ""}
          phone={profile?.phone ?? ""}
          avatarUrl={profile?.avatar_url ?? ""}
          officeAddress={profile?.office_address ?? ""}
        />
      </div>
    </div>
  );
}
