import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ITEM_STATUS } from "@/lib/constants";
import { truncate } from "@/lib/utils";
import type { ItemListRow } from "@/lib/queries";

interface ItemCardProps {
  item: ItemListRow;
  showStatus?: boolean;
}

export function ItemCard({ item, showStatus = false }: ItemCardProps) {
  const cover = item.cover?.thumb_url || item.cover?.url || item.cover_image_url;
  const status = ITEM_STATUS[item.status];
  return (
    <Link
      href={`/items/${item.slug}`}
      className="group block rounded-lg overflow-hidden border bg-card shadow-sm hover:shadow-lg transition-all hover:-translate-y-0.5"
    >
      <div className="relative aspect-[4/5] bg-muted overflow-hidden">
        {cover ? (
          <Image
            src={cover}
            alt={item.cover?.alt_text || item.title}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-4xl text-muted-foreground/40 font-display">
            {item.title.slice(0, 1)}
          </div>
        )}
        {showStatus && item.status !== "published" && (
          <Badge
            className={`absolute left-2 top-2 ${status.color}`}
            variant="outline"
          >
            {status.label}
          </Badge>
        )}
        {item.status === "sold" && (
          <Badge className="absolute right-2 top-2" variant="destructive">
            已釋出
          </Badge>
        )}
      </div>
      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-display text-lg font-semibold line-clamp-1">
            {item.title}
          </h3>
          {item.category?.name && (
            <Badge variant="secondary" className="shrink-0">
              {item.category.name}
            </Badge>
          )}
        </div>
        {item.summary && (
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {truncate(item.summary, 70)}
          </p>
        )}
        <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
          {item.era && <span>{item.era}</span>}
          {item.material && <span>{item.material}</span>}
        </div>
      </div>
    </Link>
  );
}
