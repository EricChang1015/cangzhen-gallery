import Link from "next/link";
import { SITE } from "@/lib/constants";
import { Logo } from "@/components/site/logo";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t bg-secondary/40">
      <div className="container mx-auto grid gap-10 md:grid-cols-3 px-4 py-12">
        <div className="space-y-4">
          <Logo size="md" />
          <p className="text-sm text-muted-foreground leading-7 max-w-sm">
            {SITE.description}
          </p>
        </div>
        <div className="space-y-3 text-sm">
          <h4 className="font-display text-base">瀏覽</h4>
          <div className="flex flex-col gap-2 text-muted-foreground">
            <Link href="/items" className="hover:text-foreground">藏品總覽</Link>
            <Link href="/categories" className="hover:text-foreground">藏品分類</Link>
            <Link href="/about" className="hover:text-foreground">關於藏珍閣</Link>
            <Link href="/messages" className="hover:text-foreground">與藏家對話</Link>
          </div>
        </div>
        <div className="space-y-3 text-sm">
          <h4 className="font-display text-base">藏家須知</h4>
          <p className="text-muted-foreground leading-7">
            站內所有藏品介紹之 AI 補述僅供參考，實際品相、年代、產地等以實物與藏家鑑定為準。
          </p>
        </div>
      </div>
      <div className="border-t">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-2 px-4 py-4 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} {SITE.name} · 藏珍閣</span>
          <span>{SITE.tagline}</span>
        </div>
      </div>
    </footer>
  );
}
