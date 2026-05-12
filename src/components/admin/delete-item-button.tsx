"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteItemAction } from "@/app/admin/items/actions";

export function DeleteItemButton({ itemId, title }: { itemId: string; title: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      variant="destructive"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!confirm(`確定刪除「${title}」？此操作無法復原。`)) return;
        start(async () => {
          const res = await deleteItemAction(itemId);
          if (!res.ok) {
            toast.error(res.message ?? "刪除失敗");
            return;
          }
          toast.success("已刪除");
          router.push("/admin/items");
          router.refresh();
        });
      }}
    >
      <Trash2 className="size-4" /> 刪除藏品
    </Button>
  );
}
