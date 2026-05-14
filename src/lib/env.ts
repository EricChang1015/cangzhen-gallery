/**
 * 集中讀取環境變數，未設定時提供清楚的錯誤訊息。
 *
 * ⚠️ Next.js 環境變數注入規則（很重要）：
 *   Next.js / Turbopack 只會在編譯時把「字面寫死」的 `process.env.NEXT_PUBLIC_XXX`
 *   靜態替換為字串。動態存取（例如 `process.env[key]` 或 `process.env["NAME"]`）
 *   在 browser bundle 內不會被替換，會得到 undefined。
 *
 *   因此所有 NEXT_PUBLIC_* 變數一律使用直接屬性存取。
 *
 * 在 Vercel 部署時請設定下列環境變數：
 *  - NEXT_PUBLIC_SUPABASE_URL
 *  - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY  （新版，優先使用）
 *  - NEXT_PUBLIC_SUPABASE_ANON_KEY         （舊版，向下相容）
 *  - SUPABASE_SERVICE_ROLE_KEY (server only)
 *  - POE_API_KEY (server only)
 *  - NEXT_PUBLIC_SITE_URL (例如 https://cangzhen.example.com)
 */

const NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
const NEXT_PUBLIC_SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const NEXT_PUBLIC_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const POE_BASE_URL = process.env.POE_BASE_URL ?? "https://api.poe.com/v1";

// Supabase 新版使用 PUBLISHABLE_KEY，舊版使用 ANON_KEY，兩者都相容
const supabaseAnonKey =
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const env = {
  supabaseUrl: NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey,
  siteUrl: NEXT_PUBLIC_SITE_URL,
  poeBaseUrl: POE_BASE_URL,
  isSupabaseConfigured: Boolean(NEXT_PUBLIC_SUPABASE_URL && supabaseAnonKey),
};

function required(key: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`環境變數未設定：${key}`);
  }
  return value;
}

export function getServiceRoleKey() {
  return required("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function getPoeApiKey() {
  return required("POE_API_KEY", process.env.POE_API_KEY);
}

export function requireSupabaseEnv() {
  if (!env.supabaseUrl) {
    throw new Error("環境變數未設定：NEXT_PUBLIC_SUPABASE_URL");
  }
  if (!env.supabaseAnonKey) {
    throw new Error(
      "環境變數未設定：NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY 或 NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }
}

/**
 * Server 啟動時的提早驗證：在 server module 載入時就檢查環境變數，
 * 避免等到使用者觸發互動才報錯。client bundle 不會載入此函式。
 */
if (typeof window === "undefined") {
  if (!env.isSupabaseConfigured) {
    // 不丟例外，僅警告——讓未設定的人也能跑首頁；但留下顯著訊息
    console.warn(
      "[env] Supabase 環境變數未完整設定：請確認 .env.local 內已填寫 " +
        "NEXT_PUBLIC_SUPABASE_URL 與 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (或 NEXT_PUBLIC_SUPABASE_ANON_KEY)，" +
        "並重新啟動 dev server。",
    );
  }
}
