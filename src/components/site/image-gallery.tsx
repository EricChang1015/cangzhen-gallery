"use client";

import Image from "next/image";
import { useState } from "react";
import { ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { ImageLightbox } from "@/components/site/image-lightbox";

interface ImageGalleryProps {
  images: { id: string; url: string; thumb_url?: string | null; alt_text?: string | null }[];
  title: string;
}

export function ImageGallery({ images, title }: ImageGalleryProps) {
  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (images.length === 0) {
    return (
      <div className="aspect-[4/3] bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
        尚無圖片
      </div>
    );
  }
  const current = images[Math.min(active, images.length - 1)];
  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setLightboxOpen(true)}
        aria-label="點擊放大圖片"
        className="relative aspect-[4/3] bg-muted rounded-lg overflow-hidden border w-full group cursor-zoom-in"
      >
        <Image
          key={current.id}
          src={current.url}
          alt={current.alt_text ?? title}
          fill
          sizes="(min-width: 1024px) 60vw, 100vw"
          className="object-contain"
          priority
        />
        <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-black/55 backdrop-blur-sm text-white text-xs px-2.5 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <ZoomIn className="size-3.5" /> 點擊放大
        </span>
      </button>
      {images.length > 1 && (
        <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2">
          {images.map((img, idx) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActive(idx)}
              className={cn(
                "relative aspect-square rounded-md overflow-hidden border transition-all",
                active === idx ? "ring-2 ring-primary border-primary" : "hover:opacity-80",
              )}
            >
              <Image
                src={img.thumb_url || img.url}
                alt={img.alt_text ?? title}
                fill
                sizes="100px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      <ImageLightbox
        images={images}
        index={active}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        onIndexChange={setActive}
        title={title}
      />
    </div>
  );
}
