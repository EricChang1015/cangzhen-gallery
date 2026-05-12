import { listCategories } from "@/lib/queries";
import { CategoryManager } from "@/components/admin/category-manager";

export const dynamic = "force-dynamic";
export const metadata = { title: "分類管理" };

export default async function AdminCategoriesPage() {
  const categories = await listCategories();
  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="font-display text-3xl">分類管理</h1>
        <p className="text-sm text-muted-foreground mt-1">
          可新增、刪除、調整顯示順序，slug 用於網址（建議英文小寫）。
        </p>
      </header>
      <CategoryManager categories={categories} />
    </div>
  );
}
