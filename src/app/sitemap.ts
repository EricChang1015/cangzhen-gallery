import type { MetadataRoute } from "next";
import { env } from "@/lib/env";
import { listCategories, listItems } from "@/lib/queries";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.siteUrl.replace(/\/$/, "");
  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/items`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/categories`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.5 },
  ];

  try {
    const [{ items }, categories] = await Promise.all([
      listItems({ limit: 200, status: "published" }),
      listCategories(),
    ]);

    const itemEntries: MetadataRoute.Sitemap = items.map((it) => ({
      url: `${base}/items/${it.slug}`,
      lastModified: new Date(it.updated_at),
      changeFrequency: "monthly",
      priority: 0.8,
    }));
    const catEntries: MetadataRoute.Sitemap = categories.map((c) => ({
      url: `${base}/categories/${c.slug}`,
      changeFrequency: "weekly",
      priority: 0.6,
    }));

    return [...staticEntries, ...catEntries, ...itemEntries];
  } catch {
    return staticEntries;
  }
}
