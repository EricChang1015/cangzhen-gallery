"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CommentStatus } from "@/types/database";

interface ActionResult {
  error?: string;
}

export async function setCommentStatus(
  id: string,
  status: CommentStatus,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { error: "無權限" };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("comments")
    .update({ status })
    .eq("id", id)
    .select("item_id")
    .maybeSingle();

  if (error) return { error: error.message };

  if (data?.item_id) {
    const { data: item } = await supabase
      .from("items")
      .select("slug")
      .eq("id", data.item_id)
      .maybeSingle();
    if (item?.slug) revalidatePath(`/items/${item.slug}`);
  }

  return {};
}

export async function deleteComment(id: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { error: "無權限" };

  const supabase = await createSupabaseServerClient();

  const { data: existing } = await supabase
    .from("comments")
    .select("item_id")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("comments").delete().eq("id", id);
  if (error) return { error: error.message };

  if (existing?.item_id) {
    const { data: item } = await supabase
      .from("items")
      .select("slug")
      .eq("id", existing.item_id)
      .maybeSingle();
    if (item?.slug) revalidatePath(`/items/${item.slug}`);
  }

  return {};
}
