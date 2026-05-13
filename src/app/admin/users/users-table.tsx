"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Shield, ShieldOff, Ban, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { updateUserRoleAction, toggleUserBanAction } from "./actions";
import type { Profile, UserRole } from "@/types/database";

interface UserRow {
  id: string;
  email: string;
  created_at: string;
  profile: Profile | null;
}

interface Props {
  users: UserRow[];
}

export function UsersTable({ users: initial }: Props) {
  const [users, setUsers] = useState(initial);
  const [, startTransition] = useTransition();
  const [banDialog, setBanDialog] = useState<{ userId: string; email: string } | null>(null);
  const [banReason, setBanReason] = useState("");

  function updateLocal(userId: string, patch: Partial<Profile>) {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, profile: u.profile ? { ...u.profile, ...patch } : (patch as Profile) }
          : u,
      ),
    );
  }

  function handleToggleRole(userId: string, current: UserRole) {
    const next: UserRole = current === "admin" ? "guest" : "admin";
    startTransition(async () => {
      const res = await updateUserRoleAction(userId, next);
      if (!res.ok) {
        toast.error(res.message ?? "更新失敗");
        return;
      }
      updateLocal(userId, { role: next });
      toast.success(`已將角色更新為 ${next}`);
    });
  }

  function handleUnban(userId: string) {
    startTransition(async () => {
      const res = await toggleUserBanAction(userId, false);
      if (!res.ok) {
        toast.error(res.message ?? "操作失敗");
        return;
      }
      updateLocal(userId, { is_banned: false, banned_reason: null });
      toast.success("已解除禁言");
    });
  }

  function handleBanConfirm() {
    if (!banDialog) return;
    const { userId } = banDialog;
    startTransition(async () => {
      const res = await toggleUserBanAction(userId, true, banReason || undefined);
      if (!res.ok) {
        toast.error(res.message ?? "操作失敗");
        return;
      }
      updateLocal(userId, { is_banned: true, banned_reason: banReason || null });
      toast.success("已禁止該使用者發言");
    });
    setBanDialog(null);
    setBanReason("");
  }

  return (
    <>
      <div className="rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">使用者</th>
                <th className="px-4 py-3 text-left font-medium">角色</th>
                <th className="px-4 py-3 text-left font-medium">狀態</th>
                <th className="px-4 py-3 text-left font-medium">註冊時間</th>
                <th className="px-4 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((u) => {
                const role = u.profile?.role ?? "guest";
                const isBanned = u.profile?.is_banned ?? false;
                const bannedReason = u.profile?.banned_reason;
                return (
                  <tr key={u.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <div className="font-medium">{u.profile?.display_name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{u.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={role === "admin" ? "default" : "secondary"}>
                        {role === "admin" ? "管理員" : "一般用戶"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {isBanned ? (
                        <div>
                          <Badge variant="destructive">已禁言</Badge>
                          {bannedReason && (
                            <p className="text-xs text-muted-foreground mt-0.5">{bannedReason}</p>
                          )}
                        </div>
                      ) : (
                        <Badge variant="outline">正常</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString("zh-TW")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1 flex-wrap">
                        <Button
                          size="sm"
                          variant="ghost"
                          title={role === "admin" ? "降為一般用戶" : "提升為管理員"}
                          onClick={() => handleToggleRole(u.id, role)}
                        >
                          {role === "admin" ? (
                            <ShieldOff className="size-4" />
                          ) : (
                            <Shield className="size-4" />
                          )}
                          <span className="hidden sm:inline ml-1">
                            {role === "admin" ? "降權" : "升權"}
                          </span>
                        </Button>
                        {isBanned ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleUnban(u.id)}
                          >
                            <CheckCircle className="size-4" />
                            <span className="hidden sm:inline ml-1">解禁</span>
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setBanDialog({ userId: u.id, email: u.email })}
                          >
                            <Ban className="size-4" />
                            <span className="hidden sm:inline ml-1">禁言</span>
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    尚無使用者資料
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!banDialog} onOpenChange={(o) => { if (!o) { setBanDialog(null); setBanReason(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>禁止發言</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            禁止 <span className="font-medium text-foreground">{banDialog?.email}</span> 發表留言。
          </p>
          <div className="space-y-2">
            <Label htmlFor="ban-reason">禁言原因（選填）</Label>
            <Input
              id="ban-reason"
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="例如：違反社群規範"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setBanDialog(null); setBanReason(""); }}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleBanConfirm}>
              確認禁言
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
