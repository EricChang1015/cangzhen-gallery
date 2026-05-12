import Link from "next/link";
import { cn } from "@/lib/utils";
import { SITE } from "@/lib/constants";

interface LogoProps {
  href?: string;
  className?: string;
  showTagline?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: { name: "text-xl", tag: "text-[10px]" },
  md: { name: "text-2xl", tag: "text-xs" },
  lg: { name: "text-4xl", tag: "text-sm" },
};

export function Logo({
  href = "/",
  className,
  showTagline = true,
  size = "md",
}: LogoProps) {
  const s = sizeMap[size];
  const inner = (
    <div className={cn("flex items-center gap-3", className)}>
      <span
        className="seal flex items-center justify-center"
        style={{
          width: size === "lg" ? "3rem" : size === "md" ? "2.25rem" : "1.75rem",
          height: size === "lg" ? "3rem" : size === "md" ? "2.25rem" : "1.75rem",
          letterSpacing: 0,
          fontSize: size === "lg" ? "1.4rem" : size === "md" ? "1rem" : "0.85rem",
          padding: 0,
        }}
        aria-hidden
      >
        藏
      </span>
      <span className="flex flex-col leading-tight">
        <span className={cn("font-display font-semibold tracking-[0.2em]", s.name)}>
          {SITE.name}
        </span>
        {showTagline && (
          <span
            className={cn(
              "text-muted-foreground tracking-[0.15em] mt-0.5",
              s.tag,
            )}
          >
            {SITE.tagline}
          </span>
        )}
      </span>
    </div>
  );

  if (!href) return inner;
  return (
    <Link href={href} className="inline-flex">
      {inner}
    </Link>
  );
}
