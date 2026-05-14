"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export interface ConversationRow {
  id: string;
  subject: string | null;
  last_message_at: string;
  unread_for_admin: number;
  profiles: { display_name: string | null; avatar_url: string | null } | null;
}

interface Props {
  initialConversations: ConversationRow[];
}

export function AdminMessagesList({ initialConversations }: Props) {
  const [convs, setConvs] = useState<ConversationRow[]>(initialConversations);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    async function refetch() {
      const { data } = await supabase
        .from("conversations")
        .select(
          "id, subject, last_message_at, unread_for_admin, guest_id, profiles:profiles!conversations_guest_id_fkey(display_name, avatar_url)",
        )
        .order("last_message_at", { ascending: false });
      if (!data) return;
      type RawConv = {
        id: string;
        subject: string | null;
        last_message_at: string;
        unread_for_admin: number;
        guest_id: string;
        profiles:
          | { display_name: string | null; avatar_url: string | null }[]
          | { display_name: string | null; avatar_url: string | null }
          | null;
      };
      const mapped: ConversationRow[] = (data as RawConv[]).map((c) => ({
        id: c.id,
        subject: c.subject,
        last_message_at: c.last_message_at,
        unread_for_admin: c.unread_for_admin,
        profiles: Array.isArray(c.profiles) ? c.profiles[0] ?? null : c.profiles,
      }));
      setConvs(mapped);
    }

    const channel = supabase
      .channel("admin-messages-inbox")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => {
          refetch();
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "conversations" },
        () => {
          refetch();
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "conversations" },
        () => {
          refetch();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (convs.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <MessageCircle className="size-10 mx-auto mb-2" />
          尚無對話紀錄
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="rounded-lg border bg-card divide-y">
      {convs.map((c) => (
        <Link
          key={c.id}
          href={`/admin/messages/${c.id}`}
          className="flex items-center gap-3 p-4 hover:bg-accent transition-colors"
        >
          <div className="size-10 rounded-full bg-muted flex items-center justify-center font-display">
            {(c.profiles?.display_name ?? "客").slice(0, 1)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">
                {c.profiles?.display_name ?? "藏家"}
              </span>
              {c.unread_for_admin > 0 && (
                <Badge variant="destructive">未讀 {c.unread_for_admin}</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {c.subject ?? "（無主題）"} · 最後訊息：
              {new Date(c.last_message_at).toLocaleString("zh-TW")}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
