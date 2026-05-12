"use client";

import { MessageCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface Props {
  itemTitle: string;
  loggedIn: boolean;
}

export function ContactAdminButton({ itemTitle, loggedIn }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(`您好，我對藏品「${itemTitle}」很有興趣，想進一步請教。`);
  const [loading, setLoading] = useState(false);

  if (!loggedIn) {
    return (
      <Button asChild variant="outline">
        <Link href="/login">
          <MessageCircle className="size-4" /> 登入後留言給藏家
        </Link>
      </Button>
    );
  }

  async function handleSend() {
    if (!text.trim()) return;
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) {
      toast.error("登入逾期，請重新登入");
      setLoading(false);
      return;
    }
    const { data: convExisting } = await supabase
      .from("conversations")
      .select("id")
      .eq("guest_id", u.user.id)
      .maybeSingle();

    let conversationId = convExisting?.id as string | undefined;
    if (!conversationId) {
      const { data: convNew, error: convErr } = await supabase
        .from("conversations")
        .insert({ guest_id: u.user.id, subject: itemTitle })
        .select("id")
        .single();
      if (convErr || !convNew) {
        toast.error(`建立對話失敗：${convErr?.message ?? "未知錯誤"}`);
        setLoading(false);
        return;
      }
      conversationId = convNew.id;
    }

    const { error: msgErr } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: u.user.id,
      sender_role: "guest",
      content: text.trim(),
    });

    setLoading(false);
    if (msgErr) {
      toast.error(`送出失敗：${msgErr.message}`);
      return;
    }
    toast.success("訊息已送出，藏家將盡快回覆。");
    setOpen(false);
    setTimeout(() => router.push("/messages"), 800);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <MessageCircle className="size-4" /> 直接私訊藏家
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>私訊藏家</DialogTitle>
          <DialogDescription>
            您的訊息將私下送達藏家，藏家收到後可在後台回覆您。
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          maxLength={800}
        />
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>取消</Button>
          <Button onClick={handleSend} disabled={loading || !text.trim()}>
            {loading ? "送出中…" : "送出"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
