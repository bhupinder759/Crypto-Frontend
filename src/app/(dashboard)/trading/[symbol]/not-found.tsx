import Link from "next/link";
import type { Route } from "next";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DEFAULT_SYMBOL } from "@/lib/constants/config";
import { routes } from "@/lib/constants/routes";

export default function MarketNotFound() {
  return (
    <div className="flex min-h-[60svh] flex-col items-center justify-center gap-4 text-center">
      <SearchX className="size-8 text-muted-foreground" />
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">Market not found</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          This trading pair isn&apos;t listed. Press ⌘K to search markets.
        </p>
      </div>
      <Button asChild>
        <Link href={`${routes.trading}/${DEFAULT_SYMBOL}` as Route}>
          Trade {DEFAULT_SYMBOL}
        </Link>
      </Button>
    </div>
  );
}
