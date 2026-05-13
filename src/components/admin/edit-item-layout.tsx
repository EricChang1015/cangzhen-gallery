"use client";

import { useState } from "react";
import { ImageManager } from "@/components/admin/image-manager";
import { ItemForm } from "@/components/admin/item-form";
import type { Category, Item, ItemImage } from "@/types/database";

interface Props {
  item: Item;
  initialImages: ItemImage[];
  categories: Category[];
}

/**
 * 將 ImageManager 與 ItemForm 合在同一個 client 元件，
 * 讓圖片上傳後能即時更新 ItemForm 的 uploadedImageUrls，
 * 使 AI 可以圖識物生成描述。
 */
export function EditItemLayout({ item, initialImages, categories }: Props) {
  const [imageUrls, setImageUrls] = useState<string[]>(
    initialImages.map((i) => i.url),
  );

  return (
    <>
      <section>
        <h2 className="font-display text-xl mb-3">藏品圖片</h2>
        <ImageManager
          itemId={item.id}
          initialImages={initialImages}
          onImagesChange={setImageUrls}
        />
      </section>

      <section>
        <h2 className="font-display text-xl mb-3">藏品資訊</h2>
        <ItemForm
          categories={categories}
          item={item}
          uploadedImageUrls={imageUrls}
        />
      </section>
    </>
  );
}
