"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Eye, EyeOff, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatDate, cn } from "@/lib/utils";
import {
  deleteComment as deleteCommentAction,
  setCommentStatus as setCommentStatusAction,
} from "@/lib/actions/comments";
import type { CommentStatus } from "@/types/database";

interface CommentRow {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  status: CommentStatus;
  profiles?: { display_name: string | null; avatar_url: string | null } | null;
}

interface Props {
  itemId: string;
  loggedIn: boolean;
  isAdmin?: boolean;
}

export function CommentSection({ itemId, loggedIn, isAdmin = false }: Props) {
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    let isMounted = true;

    async function fetchComment(id: string) {
      const { data } = await supabase
        .from("comments")
        .select(
          "id, content, created_at, user_id, status, profiles(display_name, avatar_url)",
        )
        .eq("id", id)
        .maybeSingle();
      return data as unknown as CommentRow | null;
    }

    (async () => {
      let query = supabase
        .from("comments")
        .select(
          "id, content, created_at, user_id, status, profiles(display_name, avatar_url)",
        )
        .eq("item_id", itemId)
        .order("created_at", { ascending: false });

      if (!isAdmin) {
        query = query.eq("status", "visible");
      }

      const { data, error } = await query;
      if (!isMounted) return;
      if (error) {
        console.error("[comment-section] 載入留言失敗", error);
      } else if (data) {
        setComments(data as unknown as CommentRow[]);
      }
      setLoading(false);
    })();

    const channel = supabase
      .channel(`comments-${itemId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "comments",
          filter: `item_id=eq.${itemId}`,
        },
        async (payload) => {
          const newRow = payload.new as { id: string };
          const row = await fetchComment(newRow.id);
          if (!row) return;
          if (!isAdmin && row.status !== "visible") return;
          setComments((prev) =>
            prev.some((c) => c.id === row.id) ? prev : [row, ...prev],
          );
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "comments",
          filter: `item_id=eq.${itemId}`,
        },
        async (payload) => {
          const updated = payload.new as { id: string; status: CommentStatus };
          if (isAdmin) {
            const row = await fetchComment(updated.id);
            if (!row) return;
            setComments((prev) => {
              if (prev.some((c) => c.id === row.id)) {
                return prev.map((c) => (c.id === row.id ? row : c));
              }
              return [row, ...prev];
            });
          } else {
            if (updated.status === "hidden") {
              setComments((prev) => prev.filter((c) => c.id !== updated.id));
            } else {
              setComments((prev) => {
                if (prev.some((c) => c.id === updated.id)) return prev;
                return prev;
              });
              const row = await fetchComment(updated.id);
              if (row && row.status === "visible") {
                setComments((prev) =>
                  prev.some((c) => c.id === row.id) ? prev : [row, ...prev],
                );
              }
            }
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "comments",
          filter: `item_id=eq.${itemId}`,
        },
        (payload) => {
          const removed = payload.old as { id: string };
          setComments((prev) => prev.filter((c) => c.id !== removed.id));
        },
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [itemId, supabase, isAdmin]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      toast.error("請先登入再留言");
      setSubmitting(false);
      return;
    }
    const { error } = await supabase
      .from("comments")
      .insert({ item_id: itemId, user_id: userData.user.id, content: content.trim() });
    setSubmitting(false);
    if (error) {
      toast.error(`留言失敗：${error.message}`);
      return;
    }
    setContent("");
    toast.success("已送出留言");
  }

  function handleToggleStatus(c: CommentRow) {
    const next: CommentStatus = c.status === "visible" ? "hidden" : "visible";
    setPendingId(c.id);
    startTransition(async () => {
      const res = await setCommentStatusAction(c.id, next);
      setPendingId(null);
      if (res.error) {
        toast.error(`操作失敗：${res.error}`);
        return;
      }
      setComments((prev) =>
        prev.map((x) => (x.id === c.id ? { ...x, status: next } : x)),
      );
      toast.success(next === "hidden" ? "已隱藏該留言" : "已恢復顯示");
    });
  }

  function handleDelete(c: CommentRow) {
    if (!confirm("確定要刪除此留言嗎？刪除後無法復原。")) return;
    setPendingId(c.id);
    startTransition(async () => {
      const res = await deleteCommentAction(c.id);
      setPendingId(null);
      if (res.error) {
        toast.error(`刪除失敗：${res.error}`);
        return;
      }
      setComments((prev) => prev.filter((x) => x.id !== c.id));
      toast.success("已刪除留言");
    });
  }

  return (
    <div className="space-y-6">
      {loggedIn ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="分享您對這件藏品的想法、提問或求購意願…"
            rows={3}
            maxLength={500}
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={submitting || !content.trim()}>
              {submitting ? "送出中…" : "送出留言"}
            </Button>
          </div>
        </form>
      ) : (
        <div className="rounded-md border bg-muted/40 p-4 text-sm text-muted-foreground flex items-center justify-between gap-3">
          <span>登入後即可留言、與管理員直接對話。</span>
          <Button asChild size="sm">
            <Link href="/login">前往登入</Link>
          </Button>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">載入留言中…</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">尚無留言，歡迎您留下第一則想法。</p>
      ) : (
        <ul className="space-y-4">
          {comments.map((c) => {
            const hidden = c.status === "hidden";
            const busy = pendingId === c.id;
            return (
              <li
                key={c.id}
                className={cn(
                  "flex items-start gap-3 border-b pb-4 last:border-0 transition-opacity",
                  hidden && "opacity-60",
                )}
              >
                <Avatar className="size-9">
                  <AvatarFallback>
                    {(c.profiles?.display_name ?? "客").slice(0, 1)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2 text-sm flex-wrap">
                    <span className="font-medium">{c.profiles?.display_name ?? "藏家"}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(c.created_at)}</span>
                    {isAdmin && hidden && (
                      <Badge variant="secondary" className="text-[10px]">
                        已隱藏
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm leading-7 whitespace-pre-wrap">{c.content}</p>
                  {isAdmin && (
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={busy}
                        onClick={() => handleToggleStatus(c)}
                        className="h-7 px-2 text-xs"
                      >
                        {hidden ? (
                          <>
                            <Eye className="size-3.5" /> 恢復顯示
                          </>
                        ) : (
                          <>
                            <EyeOff className="size-3.5" /> 隱藏
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={busy}
                        onClick={() => handleDelete(c)}
                        className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" /> 刪除
                      </Button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
