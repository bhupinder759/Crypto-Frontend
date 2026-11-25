"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RotateCw } from "lucide-react";
import type { Route } from "next";
import { Button } from "@/components/ui/button";

export function ErrorState({
  error,
  onRetry,
  homeHref = "/dashboard",
}: {
  error: Error & { digest?: string };
  onRetry: () => void;
  homeHref?: string;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60svh] flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="flex size-10 items-center justify-center rounded-full bg-sell/10 text-sell">
        <AlertTriangle className="size-5" />
      </div>
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">Something went wrong</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          This page hit an unexpected error. Try again, or head back home.
        </p>
        {error.digest ? (
          <p className="font-mono text-[11px] text-muted-foreground">
            Ref: {error.digest}
          </p>
        ) : null}
      </div>
      <div className="flex gap-2">
        <Button onClick={onRetry}>
          <RotateCw className="size-4" />
          Try again
        </Button>
        <Button variant="outline" asChild>
          <Link href={homeHref as Route}>
            <Home className="size-4" />
            Home
          </Link>
        </Button>
      </div>
    </div>
  );
}
