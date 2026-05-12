import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { ItemCard } from "@/components/site/item-card";
import { EmptyState } from "@/components/site/empty-state";
import { listCategories, listItems } from "@/lib/queries";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const cats = await listCategories();
  const c = cats.find((x) => x.slug === slug);
  return { title: c?.name ?? "分類" };
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const cats = await listCategories();
  const c = cats.find((x) => x.slug === slug);
  if (!c && cats.length > 0) notFound();
  const { items, total } = await listItems({ categorySlug: slug, limit: 60 });

  return (
    <div className="container mx-auto px-4 py-10 space-y-6">
      <Link href="/categories" className="text-sm inline-flex items-center text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" /> 全部分類
      </Link>
      <header>
        <h1 className="font-display text-3xl md:text-4xl">{c?.name ?? slug}</h1>
        {c?.description && <p className="text-muted-foreground mt-2">{c.description}</p>}
        <p className="text-xs text-muted-foreground mt-1">共 {total} 件</p>
      </header>
      {items.length === 0 ? (
        <EmptyState title="此分類尚未上架藏品" />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
          {items.map((it) => (
            <ItemCard key={it.id} item={it} />
          ))}
        </div>
      )}
    </div>
  );
}
