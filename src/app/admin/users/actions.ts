"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/database";

export async function updateUserRoleAction(userId: string, role: UserRole) {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, message: "未授權" };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("profiles")
    .update({ role, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function toggleUserBanAction(
  userId: string,
  banned: boolean,
  reason?: string,
) {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, message: "未授權" };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      is_banned: banned,
      banned_reason: banned ? (reason ?? null) : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin/users");
  return { ok: true };
}
