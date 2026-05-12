/**
 * 集中讀取環境變數，未設定時提供清楚的錯誤訊息。
 * 在 Vercel 部署時請設定下列環境變數：
 *  - NEXT_PUBLIC_SUPABASE_URL
 *  - NEXT_PUBLIC_SUPABASE_ANON_KEY
 *  - SUPABASE_SERVICE_ROLE_KEY (server only)
 *  - POE_API_KEY (server only)
 *  - NEXT_PUBLIC_SITE_URL (例如 https://cangzhen.example.com)
 */

function read(key: string, fallback?: string): string {
  const v = process.env[key] ?? fallback;
  if (!v) {
    return "";
  }
  return v;
}

function required(key: string): string {
  const v = process.env[key];
  if (!v) {
    throw new Error(`環境變數未設定：${key}`);
  }
  return v;
}

export const env = {
  supabaseUrl: read("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: read("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  siteUrl: read("NEXT_PUBLIC_SITE_URL", "http://localhost:3000"),
  poeBaseUrl: read("POE_BASE_URL", "https://api.poe.com/v1"),
  isSupabaseConfigured: Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  ),
};

export function getServiceRoleKey() {
  return required("SUPABASE_SERVICE_ROLE_KEY");
}

export function getPoeApiKey() {
  return required("POE_API_KEY");
}

export function requireSupabaseEnv() {
  required("NEXT_PUBLIC_SUPABASE_URL");
  required("NEXT_PUBLIC_SUPABASE_ANON_KEY");
}
