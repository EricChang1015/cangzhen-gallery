import { createClient } from "@supabase/supabase-js";
import { env, getServiceRoleKey } from "@/lib/env";

/**
 * 服務端使用的 service role client，可繞過 RLS。
 * 僅可在 Route Handler / Server Action 中使用，切勿暴露給瀏覽器。
 */
export function createSupabaseAdminClient() {
  return createClient(env.supabaseUrl, getServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
