import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createDraftItemAction } from "@/app/admin/items/actions";

export const metadata = { title: "新增藏品" };

/**
 * 進入新增頁時立即建立一筆草稿，並跳轉到編輯頁。
 * 編輯頁同時顯示圖片上傳區與藏品表單，手機端可立即拍照上傳。
 */
export default async function NewItemPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/login?redirect=/admin/items/new");

  const result = await createDraftItemAction();
  if (!result.ok || !result.itemId) {
    redirect("/admin/items?error=draft_failed");
  }
  redirect(`/admin/items/${result.itemId}/edit`);
}
