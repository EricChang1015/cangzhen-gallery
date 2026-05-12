"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Mode = "signin" | "signup";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) {
        toast.error(`登入失敗：${error.message}`);
        return;
      }
      toast.success("登入成功");
      router.push(redirectTo);
      router.refresh();
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName || email.split("@")[0] },
        },
      });
      setLoading(false);
      if (error) {
        toast.error(`註冊失敗：${error.message}`);
        return;
      }
      toast.success("註冊成功！若 Supabase 開啟 Email 驗證，請至信箱完成驗證後再登入。");
      setMode("signin");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-1 rounded-md border p-1 bg-muted/30 text-sm">
        <button
          type="button"
          className={`flex-1 py-1.5 rounded ${mode === "signin" ? "bg-background shadow-sm font-medium" : "text-muted-foreground"}`}
          onClick={() => setMode("signin")}
        >
          登入
        </button>
        <button
          type="button"
          className={`flex-1 py-1.5 rounded ${mode === "signup" ? "bg-background shadow-sm font-medium" : "text-muted-foreground"}`}
          onClick={() => setMode("signup")}
        >
          註冊
        </button>
      </div>

      {mode === "signup" && (
        <div className="space-y-2">
          <Label htmlFor="displayName">顯示名稱</Label>
          <Input
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="您的名字"
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">密碼</Label>
        <Input
          id="password"
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
        />
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "處理中…" : mode === "signin" ? "登入" : "建立帳號"}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        登入即代表您同意藏珍閣使用您的 Email 提供站內訊息與留言服務。
      </p>
    </form>
  );
}
