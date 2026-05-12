import Link from "next/link";
import { listCategories, listItems } from "@/lib/queries";
import { DEFAULT_CATEGORIES } from "@/lib/constants";

export const metadata = { title: "藏品分類" };
export const revalidate = 120;

export default async function CategoriesPage() {
  const categories = await listCategories();
  const cats = categories.length > 0 ? categories : DEFAULT_CATEGORIES.map((c, i) => ({
    id: c.slug, slug: c.slug, name: c.name, description: c.description, sort_order: i, created_at: "",
  }));

  // 各類別的件數
  const counts = await Promise.all(
    cats.map(async (c) => {
      const { total } = await listItems({ categorySlug: c.slug, limit: 1 });
      return { slug: c.slug, total };
    }),
  );
  const countMap = Object.fromEntries(counts.map((c) => [c.slug, c.total]));

  return (
    <div className="container mx-auto px-4 py-10 space-y-8">
      <header className="space-y-2">
        <h1 className="font-display text-3xl md:text-4xl">藏品分類</h1>
        <p className="text-muted-foreground text-sm">依品類細覽藏珍閣典藏。</p>
      </header>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        {cats.map((c) => (
          <Link
            key={c.slug}
            href={`/categories/${c.slug}`}
            className="group rounded-lg border bg-card p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl group-hover:text-primary transition-colors">
                {c.name}
              </h2>
              <span className="text-xs text-muted-foreground">
                {countMap[c.slug] ?? 0} 件
              </span>
            </div>
            {c.description && (
              <p className="mt-2 text-sm text-muted-foreground leading-7">{c.description}</p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
