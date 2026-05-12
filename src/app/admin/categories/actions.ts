"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const upsertSchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  slug: z.string().min(1).max(60).regex(/^[a-z0-9-]+$/, "slug 僅可使用英文小寫、數字與 -"),
  name: z.string().min(1).max(40),
  description: z.string().max(200).optional().or(z.literal("")),
  sort_order: z.coerce.number().int().min(0).max(9999).default(100),
});

export async function upsertCategoryAction(formData: FormData) {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, message: "未授權" };
  const parsed = upsertSchema.safeParse({
    id: formData.get("id") ?? "",
    slug: formData.get("slug"),
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    sort_order: formData.get("sort_order") ?? 100,
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.errors[0]?.message ?? "資料驗證失敗" };
  }
  const supabase = await createSupabaseServerClient();
  const data = parsed.data;
  if (data.id) {
    const { error } = await supabase
      .from("categories")
      .update({
        slug: data.slug,
        name: data.name,
        description: data.description || null,
        sort_order: data.sort_order,
      })
      .eq("id", data.id);
    if (error) return { ok: false, message: error.message };
  } else {
    const { error } = await supabase.from("categories").insert({
      slug: data.slug,
      name: data.name,
      description: data.description || null,
      sort_order: data.sort_order,
    });
    if (error) return { ok: false, message: error.message };
  }
  revalidatePath("/admin/categories");
  revalidatePath("/categories");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteCategoryAction(id: string) {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, message: "未授權" };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin/categories");
  revalidatePath("/categories");
  revalidatePath("/");
  return { ok: true };
}
