import Link from "next/link";
import { ArrowRight, Image as ImageIcon, MessageCircle, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const supabase = await createSupabaseServerClient();

  const [{ count: totalItems }, { count: published }, { count: drafts }, { count: convs }, { data: recentItems }] =
    await Promise.all([
      supabase.from("items").select("*", { count: "exact", head: true }),
      supabase.from("items").select("*", { count: "exact", head: true }).eq("status", "published"),
      supabase.from("items").select("*", { count: "exact", head: true }).eq("status", "draft"),
      supabase.from("conversations").select("*", { count: "exact", head: true }).gt("unread_for_admin", 0),
      supabase
        .from("items")
        .select("id, title, status, updated_at, slug")
        .order("updated_at", { ascending: false })
        .limit(5),
    ]);

  const stats = [
    { label: "藏品總數", value: totalItems ?? 0, icon: ImageIcon },
    { label: "公開展示", value: published ?? 0, icon: Sparkles },
    { label: "草稿中", value: drafts ?? 0, icon: ImageIcon },
    { label: "未讀訊息", value: convs ?? 0, icon: MessageCircle, href: "/admin/messages" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl">儀表板</h1>
          <p className="text-muted-foreground text-sm mt-1">歡迎回來，藏珍閣管理員。</p>
        </div>
        <Button asChild>
          <Link href="/admin/items/new">
            <Sparkles className="size-4" /> 新增藏品
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const card = (
            <Card key={s.label} className="hover:shadow-md transition-shadow h-full">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <s.icon className="size-4" /> {s.label}
                </CardDescription>
                <CardTitle className="text-3xl font-display">{s.value}</CardTitle>
              </CardHeader>
            </Card>
          );
          return s.href ? (
            <Link key={s.label} href={s.href}>{card}</Link>
          ) : (
            <div key={s.label}>{card}</div>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>近期藏品</span>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/items">
                全部 <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!recentItems || recentItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">尚無藏品資料。請先新增第一件藏品。</p>
          ) : (
            <ul className="divide-y">
              {recentItems.map((it) => (
                <li key={it.id} className="flex items-center justify-between py-3 text-sm gap-2">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{it.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {it.status} · 更新於 {new Date(it.updated_at).toLocaleString("zh-TW")}
                    </p>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/items/${it.id}/edit`}>編輯</Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
