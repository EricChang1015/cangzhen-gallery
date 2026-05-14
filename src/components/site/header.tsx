import Link from "next/link";
import { LogIn, MessageCircle, Sparkles, UserCircle2 } from "lucide-react";
import { Logo } from "@/components/site/logo";
import { Button } from "@/components/ui/button";
import { getCurrentProfile } from "@/lib/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogoutButton } from "@/components/site/logout-button";

const NAV = [
  { href: "/", label: "首頁" },
  { href: "/items", label: "藏品總覽" },
  { href: "/categories", label: "分類" },
  { href: "/about", label: "關於藏珍閣" },
];

export async function SiteHeader() {
  const profile = await getCurrentProfile();
  const isAdmin = profile?.role === "admin";

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
        <Logo size="md" showTagline={false} />

        <nav className="hidden md:flex items-center gap-1 text-sm">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button asChild variant="outline" size="sm">
              <Link href="/admin">
                <Sparkles className="size-4" />
                <span className="hidden sm:inline">後台</span>
              </Link>
            </Button>
          )}
          {profile ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="rounded-full focus:outline-none focus:ring-2 focus:ring-ring">
                <Avatar className="h-9 w-9">
                  {profile.avatar_url ? (
                    <AvatarImage src={profile.avatar_url} alt={profile.display_name ?? ""} />
                  ) : null}
                  <AvatarFallback>
                    {(profile.display_name ?? "藏").slice(0, 1)}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="font-medium">{profile.display_name ?? "藏家"}</span>
                    <span className="text-xs text-muted-foreground">
                      {profile.role === "admin" ? "管理員" : "藏家"}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/messages">
                    <MessageCircle className="mr-2 size-4" /> 我的訊息
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin">
                      <Sparkles className="mr-2 size-4" /> 進入後台
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <LogoutButton />
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">
                <LogIn className="size-4" />
                <span className="hidden sm:inline">登入</span>
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Mobile nav */}
      <nav className="flex md:hidden items-center gap-1 overflow-x-auto px-4 pb-2 text-sm">
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className="px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent whitespace-nowrap"
          >
            {n.label}
          </Link>
        ))}
        {!profile && (
          <Link
            href="/login"
            className="px-3 py-1.5 rounded-md text-primary whitespace-nowrap inline-flex items-center gap-1"
          >
            <UserCircle2 className="size-4" /> 登入
          </Link>
        )}
      </nav>
    </header>
  );
}
