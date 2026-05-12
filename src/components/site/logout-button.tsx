"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <DropdownMenuItem
      onSelect={async (e) => {
        e.preventDefault();
        if (loading) return;
        setLoading(true);
        const supabase = createSupabaseBrowserClient();
        await supabase.auth.signOut();
        router.refresh();
        router.push("/");
      }}
    >
      <LogOut className="mr-2 size-4" /> 登出
    </DropdownMenuItem>
  );
}
