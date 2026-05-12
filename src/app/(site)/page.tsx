import Link from "next/link";
import { ArrowRight, BookOpen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ItemCard } from "@/components/site/item-card";
import { EmptyState } from "@/components/site/empty-state";
import { listCategories, listItems } from "@/lib/queries";
import { SITE, DEFAULT_CATEGORIES } from "@/lib/constants";
import { env } from "@/lib/env";

export const revalidate = 60;

export default async function HomePage() {
  const [{ items: featured }, categories] = await Promise.all([
    listItems({ status: "published", limit: 8 }),
    listCategories(),
  ]);

  const cats = categories.length > 0 ? categories : DEFAULT_CATEGORIES.map((c, i) => ({
    id: c.slug,
    slug: c.slug,
    name: c.name,
    description: c.description,
    sort_order: i,
    created_at: "",
  }));

  return (
    <div className="container mx-auto px-4 pb-12">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/8 via-secondary/30 to-background mt-8 px-6 py-12 md:px-12 md:py-20">
        <div className="absolute -right-12 -top-12 size-48 rounded-full bg-primary/10 blur-3xl" aria-hidden />
        <div className="absolute -left-12 bottom-0 size-48 rounded-full bg-primary/5 blur-3xl" aria-hidden />
        <div className="relative max-w-3xl space-y-6">
          <Badge variant="outline" className="border-primary/40 text-primary tracking-widest">
            天王星名藝社
          </Badge>
          <h1 className="font-display text-4xl md:text-6xl font-semibold tracking-wide leading-snug">
            {SITE.name}
            <span className="block mt-3 text-base md:text-xl tracking-[0.3em] text-muted-foreground font-normal">
              {SITE.tagline}
            </span>
          </h1>
          <p className="max-w-2xl text-base md:text-lg text-muted-foreground leading-8">
            收藏壽山石、雞血石、玉石、石雕、木雕、字畫、瓷器、銅器、蜜蠟等藝品古玩。
            一方雅趣、一段典故，與愛好者共同細品時光淬鍊出的器物之美。
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/items">
                <BookOpen className="size-4" />
                細覽藏品 <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/about">關於藏珍閣</Link>
            </Button>
          </div>
          {!env.isSupabaseConfigured && (
            <p className="mt-4 text-xs text-amber-700 bg-amber-50 inline-block px-3 py-2 rounded-md border border-amber-200">
              提示：尚未設定 Supabase 環境變數，目前頁面為展示模式。
              請參考根目錄 <code className="font-mono">.env.example</code> 設定後重啟。
            </p>
          )}
        </div>
      </section>

      {/* Categories */}
      <section className="mt-16">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="font-display text-2xl md:text-3xl">藏品分類</h2>
            <p className="text-sm text-muted-foreground mt-1">依品類細覽</p>
          </div>
          <Link href="/categories" className="text-sm text-primary hover:underline">
            全部分類 →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {cats.slice(0, 10).map((c) => (
            <Link
              key={c.slug}
              href={`/categories/${c.slug}`}
              className="group flex flex-col items-center justify-center rounded-lg border bg-card p-4 hover:bg-accent transition-colors text-center"
            >
              <span className="font-display text-xl group-hover:text-primary transition-colors">
                {c.name}
              </span>
              {c.description && (
                <span className="text-[11px] text-muted-foreground mt-1 line-clamp-1">
                  {c.description}
                </span>
              )}
            </Link>
          ))}
        </div>
      </section>

      {/* Featured items */}
      <section className="mt-16">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="font-display text-2xl md:text-3xl flex items-center gap-2">
              <Sparkles className="size-5 text-primary" />
              新近上架
            </h2>
            <p className="text-sm text-muted-foreground mt-1">最新公開的精選藏品</p>
          </div>
          <Link href="/items" className="text-sm text-primary hover:underline">
            看全部藏品 →
          </Link>
        </div>
        {featured.length === 0 ? (
          <EmptyState
            title="尚未公開任何藏品"
            description="待管理員上架後，這裡將陳列最新的雅趣典藏。"
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
            {featured.map((it) => (
              <ItemCard key={it.id} item={it} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
