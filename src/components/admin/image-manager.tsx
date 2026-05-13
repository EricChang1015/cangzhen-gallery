"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Camera, ImageUp, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteImageAction, setCoverFromImageAction } from "@/app/admin/items/actions";
import type { ItemImage } from "@/types/database";

interface Props {
  itemId: string;
  initialImages: ItemImage[];
  /** 上傳後通知父元件最新的圖片 URL 列表（供 AI 圖片描述使用） */
  onImagesChange?: (urls: string[]) => void;
}

export function ImageManager({ itemId, initialImages, onImagesChange }: Props) {
  const router = useRouter();
  const [images, setImages] = useState<ItemImage[]>(initialImages);
  const [uploading, setUploading] = useState(false);
  const [, startMutation] = useTransition();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  function notifyParent(imgs: ItemImage[]) {
    onImagesChange?.(imgs.map((i) => i.url));
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const newImgs: ItemImage[] = [];
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
        newImgs.push(data.image as ItemImage);
      }
      if (newImgs.length > 0) {
        const updated = [...images, ...newImgs];
        setImages(updated);
        notifyParent(updated);
        toast.success("上傳完成");
        router.refresh();
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (cameraInputRef.current) cameraInputRef.current.value = "";
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
      const updated = images.filter((x) => x.id !== id);
      setImages(updated);
      notifyParent(updated);
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
      {/* 上傳區：手機大按鈕 + 桌面拖放 */}
      <div
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
        onDragOver={(e) => e.preventDefault()}
        className="rounded-xl border-2 border-dashed bg-card/40 p-6 text-center"
      >
        <div className="flex flex-col items-center gap-3">
          <ImageUp className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            拖拉圖片到此處，或選擇下方方式上傳
          </p>
          <div className="flex flex-wrap justify-center gap-3 w-full">
            {/* 手機相機拍照按鈕 */}
            <Button
              type="button"
              variant="default"
              size="lg"
              className="flex-1 min-w-[140px] gap-2 text-base"
              disabled={uploading}
              onClick={() => cameraInputRef.current?.click()}
            >
              <Camera className="size-5" />
              拍照上傳
            </Button>
            {/* 選擇現有圖片 */}
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="flex-1 min-w-[140px] gap-2 text-base"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageUp className="size-5" />
              選擇圖片
            </Button>
          </div>
          {uploading && (
            <p className="text-sm text-muted-foreground animate-pulse">上傳中，請稍候…</p>
          )}
        </div>

        {/* 相機輸入（手機直接調用相機） */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {/* 一般檔案輸入 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* 圖片列表 */}
      {images.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-2">
          尚未上傳任何圖片。第一張圖片將自動成為封面。
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((img) => (
            <div key={img.id} className="relative aspect-square rounded-md overflow-hidden border bg-muted">
              <Image
                src={img.thumb_url || img.url}
                alt={img.alt_text ?? "藏品圖"}
                fill
                sizes="200px"
                className="object-cover"
              />
              {/* 操作按鈕：永遠可見（手機沒有 hover） */}
              <div className="absolute inset-x-0 bottom-0 bg-black/60 flex items-center justify-around gap-1 py-1.5">
                <button
                  type="button"
                  onClick={() => handleSetCover(img.id)}
                  className="flex flex-col items-center text-white/90 hover:text-yellow-400 transition-colors text-[10px] gap-0.5"
                  title="設為封面"
                >
                  <Star className="size-4" />
                  <span>封面</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(img.id)}
                  className="flex flex-col items-center text-white/90 hover:text-red-400 transition-colors text-[10px] gap-0.5"
                  title="刪除"
                >
                  <Trash2 className="size-4" />
                  <span>刪除</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
