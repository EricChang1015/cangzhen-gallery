"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  upsertCategoryAction,
  deleteCategoryAction,
} from "@/app/admin/categories/actions";
import type { Category } from "@/types/database";

interface Props {
  categories: Category[];
}

const EMPTY: Partial<Category> = { id: "", slug: "", name: "", description: "", sort_order: 100 };

export function CategoryManager({ categories }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState<Partial<Category>>(EMPTY);
  const [pending, start] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const res = await upsertCategoryAction(fd);
      if (!res.ok) {
        toast.error(res.message ?? "儲存失敗");
        return;
      }
      toast.success("已儲存");
      setEditing(EMPTY);
      router.refresh();
    });
  }

  function handleDelete(id: string, name: string) {
    if (!confirm(`刪除分類「${name}」？該分類下藏品的分類欄位將清空。`)) return;
    start(async () => {
      const res = await deleteCategoryAction(id);
      if (!res.ok) {
        toast.error(res.message ?? "刪除失敗");
        return;
      }
      toast.success("已刪除");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
            <input type="hidden" name="id" value={editing.id ?? ""} />
            <div className="space-y-2">
              <Label htmlFor="name">分類名稱</Label>
              <Input
                id="name"
                name="name"
                value={editing.name ?? ""}
                onChange={(e) => setEditing((p) => ({ ...p, name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">slug（網址）</Label>
              <Input
                id="slug"
                name="slug"
                value={editing.slug ?? ""}
                onChange={(e) => setEditing((p) => ({ ...p, slug: e.target.value }))}
                placeholder="例如：jade"
                pattern="[a-z0-9-]+"
                required
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">說明</Label>
              <Textarea
                id="description"
                name="description"
                rows={2}
                value={editing.description ?? ""}
                onChange={(e) => setEditing((p) => ({ ...p, description: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sort_order">排序</Label>
              <Input
                id="sort_order"
                name="sort_order"
                type="number"
                min={0}
                max={9999}
                value={editing.sort_order ?? 100}
                onChange={(e) => setEditing((p) => ({ ...p, sort_order: Number(e.target.value) }))}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button type="submit" disabled={pending}>
                <Plus className="size-4" /> {editing.id ? "更新分類" : "新增分類"}
              </Button>
              {editing.id && (
                <Button type="button" variant="ghost" onClick={() => setEditing(EMPTY)}>
                  取消編輯
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="rounded-lg border bg-card divide-y">
        {categories.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground text-center">尚無分類</p>
        ) : (
          categories.map((c) => (
            <div key={c.id} className="flex items-center gap-3 p-4">
              <div className="flex-1">
                <p className="font-medium">
                  {c.name} <span className="text-xs text-muted-foreground">/{c.slug}</span>
                </p>
                {c.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{c.description}</p>
                )}
              </div>
              <span className="text-xs text-muted-foreground">排序：{c.sort_order}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditing(c)}
                disabled={pending}
              >
                <Pencil className="size-4" />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDelete(c.id, c.name)}
                disabled={pending}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
