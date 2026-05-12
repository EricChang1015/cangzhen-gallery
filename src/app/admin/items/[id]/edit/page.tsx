import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ItemForm } from "@/components/admin/item-form";
import { ImageManager } from "@/components/admin/image-manager";
import { DeleteItemButton } from "@/components/admin/delete-item-button";
import { listCategories } from "@/lib/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Item, ItemImage } from "@/types/database";

export const metadata = { title: "編輯藏品" };

export default async function EditItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const [{ data: item }, { data: imgs }, categories] = await Promise.all([
    supabase.from("items").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("item_images")
      .select("*")
      .eq("item_id", id)
      .order("sort_order"),
    listCategories(),
  ]);
  if (!item) notFound();
  const typedItem = item as Item;
  const typedImgs = (imgs ?? []) as ItemImage[];

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/items">
            <ChevronLeft className="size-4" /> 返回列表
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/items/${typedItem.slug}`} target="_blank">
              <ExternalLink className="size-4" /> 預覽
            </Link>
          </Button>
          <DeleteItemButton itemId={typedItem.id} title={typedItem.title} />
        </div>
      </div>
      <header className="space-y-1">
        <h1 className="font-display text-3xl">{typedItem.title}</h1>
        <p className="text-sm text-muted-foreground">
          狀態：{typedItem.status} · 上次更新：
          {new Date(typedItem.updated_at).toLocaleString("zh-TW")}
        </p>
      </header>

      <section>
        <h2 className="font-display text-xl mb-3">藏品圖片</h2>
        <ImageManager itemId={typedItem.id} initialImages={typedImgs} />
      </section>

      <section>
        <h2 className="font-display text-xl mb-3">藏品資訊</h2>
        <ItemForm categories={categories} item={typedItem} />
      </section>
    </div>
  );
}
