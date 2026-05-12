import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Category, Item, ItemImage, ItemStatus } from "@/types/database";

export type ItemListRow = Item & {
  category: Pick<Category, "id" | "slug" | "name"> | null;
  cover: ItemImage | null;
};

export interface ListItemsParams {
  status?: ItemStatus | "all";
  categorySlug?: string;
  search?: string;
  limit?: number;
  offset?: number;
  orderBy?: "newest" | "oldest" | "popular";
}

async function tryGet<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

export async function listCategories(): Promise<Category[]> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order")
      .order("name");
    return (data as Category[]) ?? [];
  } catch {
    return [];
  }
}

export async function listItems({
  status = "published",
  categorySlug,
  search,
  limit = 24,
  offset = 0,
  orderBy = "newest",
}: ListItemsParams = {}): Promise<{ items: ItemListRow[]; total: number }> {
  try {
    const supabase = await createSupabaseServerClient();
    let query = supabase
      .from("items")
      .select(
        `*, category:categories(id, slug, name), images:item_images(id, url, thumb_url, sort_order, alt_text)`,
        { count: "exact" },
      );

    if (status !== "all") {
      query = query.eq("status", status);
    }
    if (search) {
      query = query.or(
        `title.ilike.%${search}%,summary.ilike.%${search}%,ai_description.ilike.%${search}%`,
      );
    }
    if (orderBy === "newest") {
      query = query.order("published_at", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false });
    } else if (orderBy === "oldest") {
      query = query.order("created_at", { ascending: true });
    } else if (orderBy === "popular") {
      query = query.order("view_count", { ascending: false });
    }

    if (categorySlug) {
      const cat = await tryGet<{ id: string } | null>(
        async () => {
          const r = await supabase
            .from("categories")
            .select("id")
            .eq("slug", categorySlug)
            .maybeSingle();
          return (r.data as { id: string } | null) ?? null;
        },
        null,
      );
      if (cat?.id) {
        query = query.eq("category_id", cat.id);
      }
    }

    const { data, count, error } = await query.range(offset, offset + limit - 1);
    if (error) throw error;

    const rows = (data ?? []).map((row: Item & {
      category: { id: string; slug: string; name: string } | null;
      images: ItemImage[] | null;
    }) => {
      const images = (row.images ?? []).slice().sort((a, b) => a.sort_order - b.sort_order);
      return {
        ...row,
        cover: images[0] ?? null,
      } as ItemListRow;
    });
    return { items: rows, total: count ?? rows.length };
  } catch (e) {
    console.error("listItems error", e);
    return { items: [], total: 0 };
  }
}

export async function getItemBySlug(slug: string) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("items")
      .select(
        `*, category:categories(id, slug, name), images:item_images(*)`,
      )
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const images = (data.images ?? [])
      .slice()
      .sort((a: ItemImage, b: ItemImage) => a.sort_order - b.sort_order);
    return { ...data, images } as Item & {
      category: { id: string; slug: string; name: string } | null;
      images: ItemImage[];
    };
  } catch (e) {
    console.error("getItemBySlug error", e);
    return null;
  }
}

export async function incrementItemView(itemId: string) {
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.rpc("increment_item_view", { p_item_id: itemId });
  } catch {
    // 若 rpc 不存在則略過
  }
}
