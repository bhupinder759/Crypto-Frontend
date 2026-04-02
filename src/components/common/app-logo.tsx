import Link from "next/link";
import { cn } from "@/lib/utils";

export function AppLogo({ className }: { className?: string }) {
  return (
    <Link
      href="/dashboard"
      className={cn("flex items-center gap-3 font-heading", className)}
    >
      <span className="flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
        NX
      </span>
      <span className="flex flex-col">
        <span className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
          Nexfin
        </span>
        <span className="text-base font-semibold text-foreground">Exchange</span>
      </span>
    </Link>
  );
}
