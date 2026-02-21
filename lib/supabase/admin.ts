import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { env, getServiceRoleKey } from "@/lib/env";
import type { Database } from "@/lib/supabase/types";

/** Server-side only. Never import this in client components. */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    getServiceRoleKey(),
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
