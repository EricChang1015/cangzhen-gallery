import Link from "next/link";
import { Eye, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { listItems, listCategories } from "@/lib/queries";
import { ITEM_STATUS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function AdminItemsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cat?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const status = (sp.status as "draft" | "published" | "reserved" | "sold" | "all" | undefined) || "all";
  const cat = sp.cat || undefined;
  const q = sp.q?.trim() || undefined;

  const [{ items }, categories] = await Promise.all([
    listItems({ status, categorySlug: cat, search: q, limit: 200 }),
    listCategories(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl">藏品管理</h1>
          <p className="text-sm text-muted-foreground mt-1">共 {items.length} 件</p>
        </div>
        <Button asChild>
          <Link href="/admin/items/new">
            <Plus className="size-4" /> 新增藏品
          </Link>
        </Button>
      </div>

      <form className="flex flex-wrap gap-2 items-center" action="/admin/items">
        <Input
          name="q"
          placeholder="搜尋品名..."
          defaultValue={q}
          className="w-56"
        />
        <select name="cat" defaultValue={cat ?? ""} className="h-10 rounded-md border bg-background px-3 text-sm">
          <option value="">全部分類</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>{c.name}</option>
          ))}
        </select>
        <select name="status" defaultValue={status} className="h-10 rounded-md border bg-background px-3 text-sm">
          <option value="all">全部狀態</option>
          {Object.entries(ITEM_STATUS).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <Button type="submit" variant="outline">套用</Button>
      </form>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
          沒有符合條件的藏品。
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <div className="hidden md:grid grid-cols-[80px_2fr_1fr_1fr_1fr_120px_180px] items-center bg-muted/40 text-xs font-medium px-4 py-2 border-b">
            <div>圖片</div>
            <div>品名</div>
            <div>分類</div>
            <div>年代</div>
            <div>材質</div>
            <div>狀態</div>
            <div className="text-right">操作</div>
          </div>
          {items.map((it) => {
            const status = ITEM_STATUS[it.status];
            return (
              <div
                key={it.id}
                className="flex flex-col md:grid md:grid-cols-[80px_2fr_1fr_1fr_1fr_120px_180px] items-start md:items-center px-4 py-3 border-b last:border-0 gap-2 hover:bg-accent/40"
              >
                <div className="size-16 rounded bg-muted overflow-hidden">
                  {it.cover?.thumb_url || it.cover?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={it.cover.thumb_url || it.cover.url}
                      alt={it.title}
                      className="object-cover w-full h-full"
                    />
                  ) : null}
                </div>
                <div className="font-medium">{it.title}</div>
                <div className="text-sm text-muted-foreground">{it.category?.name ?? "—"}</div>
                <div className="text-sm text-muted-foreground">{it.era ?? "—"}</div>
                <div className="text-sm text-muted-foreground">{it.material ?? "—"}</div>
                <div>
                  <Badge variant="outline" className={status.color}>{status.label}</Badge>
                </div>
                <div className="flex justify-end gap-2 w-full">
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/items/${it.slug}`} target="_blank">
                      <Eye className="size-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/items/${it.id}/edit`}>
                      <Pencil className="size-4" /> 編輯
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
