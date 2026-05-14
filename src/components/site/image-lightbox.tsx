"use client";

import { useCallback, useEffect, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  TransformWrapper,
  TransformComponent,
  useControls,
} from "react-zoom-pan-pinch";
import {
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  RotateCcw,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LightboxImage {
  id: string;
  url: string;
  alt_text?: string | null;
}

interface Props {
  images: LightboxImage[];
  index: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onIndexChange?: (index: number) => void;
  title: string;
}

function ZoomControls({
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}: {
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}) {
  const { zoomIn, zoomOut, resetTransform } = useControls();

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-md text-white px-2 py-1.5 shadow-lg">
      <button
        type="button"
        onClick={onPrev}
        disabled={!hasPrev}
        aria-label="上一張"
        className="size-9 rounded-full inline-flex items-center justify-center hover:bg-white/15 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
      >
        <ChevronLeft className="size-5" />
      </button>
      <button
        type="button"
        onClick={() => zoomOut()}
        aria-label="縮小"
        className="size-9 rounded-full inline-flex items-center justify-center hover:bg-white/15 transition-colors"
      >
        <Minus className="size-5" />
      </button>
      <button
        type="button"
        onClick={() => resetTransform()}
        aria-label="還原"
        className="size-9 rounded-full inline-flex items-center justify-center hover:bg-white/15 transition-colors"
      >
        <RotateCcw className="size-5" />
      </button>
      <button
        type="button"
        onClick={() => zoomIn()}
        aria-label="放大"
        className="size-9 rounded-full inline-flex items-center justify-center hover:bg-white/15 transition-colors"
      >
        <Plus className="size-5" />
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={!hasNext}
        aria-label="下一張"
        className="size-9 rounded-full inline-flex items-center justify-center hover:bg-white/15 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
      >
        <ChevronRight className="size-5" />
      </button>
    </div>
  );
}

export function ImageLightbox({
  images,
  index,
  open,
  onOpenChange,
  onIndexChange,
  title,
}: Props) {
  const [current, setCurrent] = useState(index);
  const [wasOpen, setWasOpen] = useState(open);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setCurrent(index);
  }

  const goPrev = useCallback(() => {
    setCurrent((i) => {
      const next = Math.max(0, i - 1);
      onIndexChange?.(next);
      return next;
    });
  }, [onIndexChange]);

  const goNext = useCallback(() => {
    setCurrent((i) => {
      const next = Math.min(images.length - 1, i + 1);
      onIndexChange?.(next);
      return next;
    });
  }, [images.length, onIndexChange]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, goPrev, goNext]);

  if (images.length === 0) return null;
  const img = images[Math.min(current, images.length - 1)];
  const hasPrev = current > 0;
  const hasNext = current < images.length - 1;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-black/95 data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            "fixed inset-0 z-50 flex flex-col outline-none",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          )}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            可使用滑鼠滾輪、雙擊或雙指縮放，拖曳移動圖片；左右鍵切換圖片，Esc 關閉。
          </DialogPrimitive.Description>

          <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
            {images.length > 1 && (
              <span className="rounded-full bg-black/60 backdrop-blur-md text-white text-sm px-3 py-1.5">
                {current + 1} / {images.length}
              </span>
            )}
            <DialogPrimitive.Close
              aria-label="關閉"
              className="size-10 rounded-full inline-flex items-center justify-center bg-black/60 backdrop-blur-md text-white hover:bg-black/80 transition-colors"
            >
              <X className="size-5" />
            </DialogPrimitive.Close>
          </div>

          <div className="flex-1 relative">
            <TransformWrapper
              key={img.id}
              initialScale={1}
              minScale={1}
              maxScale={8}
              centerOnInit
              doubleClick={{ mode: "toggle", step: 2 }}
              wheel={{ step: 0.2 }}
              pinch={{ step: 5 }}
              limitToBounds={false}
            >
              <TransformComponent
                wrapperStyle={{ width: "100%", height: "100%" }}
                contentStyle={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.alt_text ?? title}
                  draggable={false}
                  className="max-w-[100vw] max-h-[100vh] object-contain select-none"
                />
              </TransformComponent>
              <ZoomControls
                onPrev={goPrev}
                onNext={goNext}
                hasPrev={hasPrev}
                hasNext={hasNext}
              />
            </TransformWrapper>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
