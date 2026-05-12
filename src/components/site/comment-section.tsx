"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";

interface CommentRow {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles?: { display_name: string | null; avatar_url: string | null } | null;
}

interface Props {
  itemId: string;
  loggedIn: boolean;
}

export function CommentSection({ itemId, loggedIn }: Props) {
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const { data, error } = await supabase
        .from("comments")
        .select("id, content, created_at, user_id, profiles(display_name, avatar_url)")
        .eq("item_id", itemId)
        .eq("status", "visible")
        .order("created_at", { ascending: false });
      if (!isMounted) return;
      if (!error && data) setComments(data as unknown as CommentRow[]);
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
          const { data } = await supabase
            .from("comments")
            .select("id, content, created_at, user_id, profiles(display_name, avatar_url)")
            .eq("id", newRow.id)
            .maybeSingle();
          if (data) setComments((prev) => [data as unknown as CommentRow, ...prev]);
        },
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [itemId, supabase]);

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
          {comments.map((c) => (
            <li key={c.id} className="flex items-start gap-3 border-b pb-4 last:border-0">
              <Avatar className="size-9">
                <AvatarFallback>
                  {(c.profiles?.display_name ?? "客").slice(0, 1)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{c.profiles?.display_name ?? "藏家"}</span>
                  <span className="text-xs text-muted-foreground">{formatDate(c.created_at)}</span>
                </div>
                <p className="text-sm leading-7 whitespace-pre-wrap">{c.content}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
