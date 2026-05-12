import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";
export const metadata = { title: "訊息收件匣" };

export default async function AdminMessagesIndex() {
  const supabase = await createSupabaseServerClient();
  const { data: rawConvs } = await supabase
    .from("conversations")
    .select("id, subject, last_message_at, unread_for_admin, guest_id, profiles:profiles!conversations_guest_id_fkey(display_name, avatar_url)")
    .order("last_message_at", { ascending: false });

  type RawConv = {
    id: string;
    subject: string | null;
    last_message_at: string;
    unread_for_admin: number;
    guest_id: string;
    profiles: { display_name: string | null; avatar_url: string | null }[] | { display_name: string | null; avatar_url: string | null } | null;
  };
  const convs = (rawConvs as RawConv[] | null)?.map((c) => ({
    id: c.id,
    subject: c.subject,
    last_message_at: c.last_message_at,
    unread_for_admin: c.unread_for_admin,
    profiles: Array.isArray(c.profiles) ? c.profiles[0] ?? null : c.profiles,
  }));

  return (
    <div className="space-y-6 max-w-4xl">
      <header>
        <h1 className="font-display text-3xl">訊息收件匣</h1>
        <p className="text-sm text-muted-foreground mt-1">
          所有藏家私訊紀錄，即時更新。
        </p>
      </header>

      {!convs || convs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <MessageCircle className="size-10 mx-auto mb-2" />
            尚無對話紀錄
          </CardContent>
        </Card>
      ) : (
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
      )}
    </div>
  );
}
