import Link from "next/link";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ItemCard } from "@/components/site/item-card";
import { EmptyState } from "@/components/site/empty-state";
import { listCategories, listItems } from "@/lib/queries";

export const metadata = { title: "藏品總覽" };

const PAGE_SIZE = 24;

export default async function ItemsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cat?: string; sort?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() || undefined;
  const cat = sp.cat || undefined;
  const sort = (sp.sort as "newest" | "popular" | "oldest" | undefined) || "newest";
  const page = Math.max(1, Number(sp.page) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const [{ items, total }, categories] = await Promise.all([
    listItems({
      status: "published",
      categorySlug: cat,
      search: q,
      orderBy: sort,
      limit: PAGE_SIZE,
      offset,
    }),
    listCategories(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function buildHref(p: Record<string, string | number | undefined>) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (cat) params.set("cat", cat);
    if (sort && sort !== "newest") params.set("sort", sort);
    Object.entries(p).forEach(([k, v]) => {
      if (v == null || v === "") params.delete(k);
      else params.set(k, String(v));
    });
    const s = params.toString();
    return s ? `/items?${s}` : "/items";
  }

  return (
    <div className="container mx-auto px-4 py-10 space-y-8">
      <header className="space-y-2">
        <h1 className="font-display text-3xl md:text-4xl">藏品總覽</h1>
        <p className="text-sm text-muted-foreground">共 {total} 件公開藏品</p>
      </header>

      {/* search & filter */}
      <form className="flex flex-col md:flex-row gap-3" action="/items" method="get">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={q}
            placeholder="搜尋品名、簡介、AI 介紹…"
            className="pl-9"
          />
        </div>
        {cat && <input type="hidden" name="cat" value={cat} />}
        {sort !== "newest" && <input type="hidden" name="sort" value={sort} />}
        <Button type="submit">搜尋</Button>
      </form>

      <div className="flex flex-wrap gap-2 items-center">
        <Link href={buildHref({ cat: undefined })}>
          <Badge variant={!cat ? "default" : "outline"}>全部</Badge>
        </Link>
        {categories.map((c) => (
          <Link key={c.slug} href={buildHref({ cat: c.slug })}>
            <Badge variant={cat === c.slug ? "default" : "outline"}>{c.name}</Badge>
          </Link>
        ))}
        <span className="ml-auto flex gap-2 text-xs text-muted-foreground items-center">
          排序：
          <Link href={buildHref({ sort: "newest" })} className={sort === "newest" ? "text-primary font-medium" : ""}>最新</Link>
          <Link href={buildHref({ sort: "popular" })} className={sort === "popular" ? "text-primary font-medium" : ""}>熱門</Link>
          <Link href={buildHref({ sort: "oldest" })} className={sort === "oldest" ? "text-primary font-medium" : ""}>最早</Link>
        </span>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="找不到符合條件的藏品"
          description="試試調整關鍵字或分類篩選。"
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
          {items.map((it) => (
            <ItemCard key={it.id} item={it} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-6">
          {Array.from({ length: totalPages }).map((_, i) => {
            const p = i + 1;
            return (
              <Link
                key={p}
                href={buildHref({ page: p === 1 ? undefined : p })}
                className={
                  "h-9 min-w-9 inline-flex items-center justify-center rounded-md border px-3 text-sm " +
                  (p === page ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent")
                }
              >
                {p}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
