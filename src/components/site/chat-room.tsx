"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface MessageRow {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  sender_role: "admin" | "guest";
  conversation_id: string;
}

interface ChatRoomProps {
  conversationId: string;
  currentUserId: string;
  role: "admin" | "guest";
  emptyHint?: string;
}

export function ChatRoom({
  conversationId,
  currentUserId,
  role,
  emptyHint = "尚無訊息，從這裡開始對話。",
}: ChatRoomProps) {
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      if (isMounted && data) setMessages(data as MessageRow[]);

      // 標記對方訊息為已讀
      const targetField = role === "admin" ? "unread_for_admin" : "unread_for_guest";
      await supabase
        .from("conversations")
        .update({ [targetField]: 0 })
        .eq("id", conversationId);
    })();

    const channel = supabase
      .channel(`conv-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as MessageRow]);
        },
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [conversationId, role, supabase]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || sending) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: currentUserId,
      sender_role: role,
      content: content.trim(),
    });
    setSending(false);
    if (error) {
      toast.error(`送出失敗：${error.message}`);
      return;
    }
    setContent("");
  }

  return (
    <div className="border rounded-lg bg-card flex flex-col h-[60vh]">
      <ScrollArea className="flex-1">
        <div ref={scrollRef} className="p-4 space-y-3 overflow-y-auto h-full">
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">{emptyHint}</p>
          ) : (
            messages.map((m) => {
              const mine = m.sender_id === currentUserId;
              return (
                <div
                  key={m.id}
                  className={cn(
                    "flex flex-col max-w-[80%] gap-1",
                    mine ? "ml-auto items-end" : "items-start",
                  )}
                >
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap leading-relaxed",
                      mine
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-secondary text-secondary-foreground rounded-bl-md",
                    )}
                  >
                    {m.content}
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(m.created_at).toLocaleString("zh-TW", { hour12: false })}
                    {m.sender_role === "admin" ? " · 藏家" : ""}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
      <form onSubmit={handleSend} className="border-t p-3 flex gap-2 items-end">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={2}
          maxLength={1000}
          placeholder="輸入訊息，Ctrl+Enter 送出"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              handleSend(e);
            }
          }}
          className="min-h-[60px]"
        />
        <Button type="submit" disabled={sending || !content.trim()}>
          <Send className="size-4" /> 送出
        </Button>
      </form>
    </div>
  );
}
