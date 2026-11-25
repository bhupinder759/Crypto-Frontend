"use client";

import { useEffect } from "react";
import "./globals.css";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body className="flex min-h-svh items-center justify-center bg-background p-4 font-sans text-foreground">
        <title>Something went wrong | Nexfin</title>
        <div className="max-w-sm space-y-3 text-center">
          <h1 className="text-lg font-semibold">Nexfin is having trouble</h1>
          <p className="text-sm text-muted-foreground">
            An unexpected error stopped the app from loading.
            {error.digest ? ` Ref: ${error.digest}` : ""}
          </p>
          <button
            type="button"
            onClick={() => unstable_retry()}
            className="h-8 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
