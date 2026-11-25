import Link from "next/link";
import { cn } from "@/lib/utils";

export function AppLogo({
  className,
  compact = false,
  href = "/dashboard",
}: {
  className?: string;
  compact?: boolean;
  href?: string;
}) {
  return (
    <Link
      href={href}
      aria-label="Nexfin home"
      className={cn("flex items-center gap-2 font-heading", className)}
    >
      <span className="flex size-7 items-center justify-center rounded-md bg-primary text-[11px] font-bold text-primary-foreground">
        NX
      </span>
      {compact ? null : (
        <span className="text-sm font-semibold tracking-tight text-foreground">
          Nexfin
        </span>
      )}
    </Link>
  );
}
