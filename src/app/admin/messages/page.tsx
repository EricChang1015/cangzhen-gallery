import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  AdminMessagesList,
  type ConversationRow,
} from "@/components/admin/admin-messages-list";

export const dynamic = "force-dynamic";
export const metadata = { title: "訊息收件匣" };

export default async function AdminMessagesIndex() {
  const supabase = await createSupabaseServerClient();
  const { data: rawConvs, error: convError } = await supabase
    .from("conversations")
    .select(
      "id, subject, last_message_at, unread_for_admin, guest_id, profiles:profiles!conversations_guest_id_fkey(display_name, avatar_url)",
    )
    .order("last_message_at", { ascending: false });
  if (convError) {
    console.error("[admin/messages] 載入對話列表失敗", convError);
  }

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
  const convs: ConversationRow[] = (rawConvs as RawConv[] | null ?? []).map((c) => ({
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

      <AdminMessagesList initialConversations={convs} />
    </div>
  );
}
