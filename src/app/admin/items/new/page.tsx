import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ItemForm } from "@/components/admin/item-form";
import { listCategories } from "@/lib/queries";

export const metadata = { title: "新增藏品" };

export default async function NewItemPage() {
  const categories = await listCategories();
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/items">
            <ChevronLeft className="size-4" /> 返回列表
          </Link>
        </Button>
      </div>
      <header>
        <h1 className="font-display text-3xl">新增藏品</h1>
        <p className="text-sm text-muted-foreground mt-1">
          僅需填寫品名與少量資訊，其餘可由 AI 補述。儲存後即可上傳圖片。
        </p>
      </header>
      <ItemForm categories={categories} />
    </div>
  );
}
