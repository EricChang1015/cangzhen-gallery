"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ImageUp, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteImageAction, setCoverFromImageAction } from "@/app/admin/items/actions";
import type { ItemImage } from "@/types/database";

interface Props {
  itemId: string;
  initialImages: ItemImage[];
}

export function ImageManager({ itemId, initialImages }: Props) {
  const router = useRouter();
  // 以 props 為初始值；後續操作以本地 state + router.refresh() 同步
  const [images, setImages] = useState<ItemImage[]>(initialImages);
  const [uploading, setUploading] = useState(false);
  const [, startMutation] = useTransition();
  const inputRef = useRef<HTMLInputElement | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("item_id", itemId);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) {
          toast.error(`「${file.name}」上傳失敗：${data.error ?? "未知錯誤"}`);
          continue;
        }
        setImages((prev) => [...prev, data.image as ItemImage]);
      }
      toast.success("上傳完成");
      router.refresh();
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleDelete(id: string) {
    if (!confirm("確認刪除此圖片？此操作無法復原。")) return;
    startMutation(async () => {
      const res = await deleteImageAction(id);
      if (!res.ok) {
        toast.error(res.message ?? "刪除失敗");
        return;
      }
      setImages((prev) => prev.filter((x) => x.id !== id));
      router.refresh();
    });
  }

  function handleSetCover(id: string) {
    startMutation(async () => {
      const res = await setCoverFromImageAction(id);
      if (!res.ok) {
        toast.error(res.message ?? "設定封面失敗");
        return;
      }
      toast.success("已設為封面");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
        onDragOver={(e) => e.preventDefault()}
        className="rounded-lg border-2 border-dashed bg-card/40 p-6 text-center"
      >
        <ImageUp className="mx-auto size-8 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">
          拖拉圖片到此處，或
          <button
            type="button"
            className="text-primary underline mx-1"
            onClick={() => inputRef.current?.click()}
          >
            選擇檔案
          </button>
          上傳。系統會自動壓縮成 webp。
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {uploading && <p className="mt-2 text-xs text-muted-foreground">上傳中…</p>}
      </div>

      {images.length === 0 ? (
        <p className="text-sm text-muted-foreground">尚未上傳任何圖片。第一張圖片將自動成為封面。</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((img) => (
            <div key={img.id} className="group relative aspect-square rounded-md overflow-hidden border bg-muted">
              <Image
                src={img.thumb_url || img.url}
                alt={img.alt_text ?? "藏品圖"}
                fill
                sizes="200px"
                className="object-cover"
              />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-black/40 flex items-center justify-center gap-2 transition-opacity">
                <Button type="button" size="sm" variant="outline" onClick={() => handleSetCover(img.id)}>
                  <Star className="size-4" /> 設封面
                </Button>
                <Button type="button" size="sm" variant="destructive" onClick={() => handleDelete(img.id)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
