"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type SignOutButtonProps = {
  label?: string;
  className?: string;
};

export default function SignOutButton({
  label = "Sign out",
  className = "font-medium text-navy-700 hover:underline",
}: SignOutButtonProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    await supabase.auth.signOut();
    router.push("/auth");
    router.refresh();
    setLoading(false);
  }

  return (
    <button type="button" onClick={handleSignOut} className={className} disabled={loading}>
      {loading ? "Signing out..." : label}
    </button>
  );
}
