import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatRoom } from "@/components/site/chat-room";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = { title: "對話" };

export default async function AdminConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await requireAdmin();
  if (!admin) notFound();

  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: conv } = await supabase
    .from("conversations")
    .select("id, subject, guest_id, profiles:profiles!conversations_guest_id_fkey(display_name)")
    .eq("id", id)
    .maybeSingle();
  if (!conv) notFound();

  type ProfileRel = { display_name: string | null } | null;
  const profilesField = (conv as unknown as { profiles?: ProfileRel | ProfileRel[] }).profiles;
  const guestProfile: ProfileRel = Array.isArray(profilesField)
    ? profilesField[0] ?? null
    : profilesField ?? null;

  return (
    <div className="space-y-4 max-w-3xl">
      <Button asChild variant="ghost" size="sm">
        <Link href="/admin/messages">
          <ChevronLeft className="size-4" /> 返回收件匣
        </Link>
      </Button>
      <header>
        <h1 className="font-display text-2xl">
          與 {guestProfile?.display_name ?? "藏家"} 對話
        </h1>
        {conv.subject && <p className="text-sm text-muted-foreground">主題：{conv.subject}</p>}
      </header>
      <ChatRoom conversationId={conv.id} currentUserId={admin.id} role="admin" />
    </div>
  );
}
