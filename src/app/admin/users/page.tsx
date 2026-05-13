import { requireAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";
import { UsersTable } from "./users-table";

export const metadata = { title: "使用者管理" };

export default async function UsersPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin");

  const adminClient = createSupabaseAdminClient();
  const supabase = await createSupabaseServerClient();

  const [{ data: authData }, { data: profilesData }] = await Promise.all([
    adminClient.auth.admin.listUsers({ perPage: 1000 }),
    supabase.from("profiles").select("*").order("created_at", { ascending: false }),
  ]);

  const profiles: Profile[] = (profilesData ?? []) as Profile[];
  const profileMap = new Map(profiles.map((p) => [p.id, p]));

  const users = (authData?.users ?? []).map((u) => ({
    id: u.id,
    email: u.email ?? "",
    created_at: u.created_at,
    profile: profileMap.get(u.id) ?? null,
  }));

  return (
    <div className="space-y-6 max-w-5xl">
      <header>
        <h1 className="font-display text-3xl">使用者管理</h1>
        <p className="text-sm text-muted-foreground mt-1">
          管理所有已註冊的使用者，可調整角色或限制發言。
        </p>
      </header>
      <UsersTable users={users} />
    </div>
  );
}
