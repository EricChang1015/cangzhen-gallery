import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChatRoom } from "@/components/site/chat-room";
import { getCurrentProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = { title: "我的訊息" };

export default async function MessagesPage() {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/login?redirect=/messages");
  }
  if (profile.role === "admin") {
    redirect("/admin/messages");
  }

  const supabase = await createSupabaseServerClient();
  const { data: conv } = await supabase
    .from("conversations")
    .select("id")
    .eq("guest_id", profile.id)
    .maybeSingle();

  if (!conv) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl text-center space-y-4">
        <h1 className="font-display text-3xl">我的訊息</h1>
        <p className="text-muted-foreground">
          您尚未與藏家展開過對話。瀏覽藏品時可使用「私訊藏家」按鈕開啟對話。
        </p>
        <Button asChild>
          <Link href="/items">前往藏品總覽</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl space-y-4">
      <h1 className="font-display text-3xl">與藏家對話</h1>
      <p className="text-sm text-muted-foreground">藏家收到訊息後將在後台回覆，新訊息會即時出現。</p>
      <ChatRoom conversationId={conv.id} currentUserId={profile.id} role="guest" />
    </div>
  );
}
