import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DEFAULT_SETTINGS, type AppSettings } from "@/lib/constants";

export async function getSettings(): Promise<AppSettings> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("settings").select("key, value");
    if (error || !data) return { ...DEFAULT_SETTINGS };
    const merged = { ...DEFAULT_SETTINGS } as Record<string, unknown>;
    for (const row of data) {
      merged[row.key] = row.value as unknown;
    }
    return merged as AppSettings;
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}
