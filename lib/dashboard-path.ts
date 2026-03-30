import type { UserRole } from "@/lib/supabase/types";

export function getDashboardPath(role?: UserRole | null) {
  if (role === "associate") return "/associate/dashboard";
  if (role === "client") return "/client/dashboard";
  return "/advocate/dashboard";
}
