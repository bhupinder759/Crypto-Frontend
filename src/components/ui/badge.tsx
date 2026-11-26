import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded border px-1.5 py-0.5 text-[11px] font-medium leading-none whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "border-border bg-secondary text-secondary-foreground",
        success: "border-buy/25 bg-buy/10 text-buy",
        danger: "border-sell/25 bg-sell/10 text-sell",
        warning: "border-warning/25 bg-warning/10 text-warning",
        muted: "border-border bg-muted text-muted-foreground",
        info: "border-sky-500/20 bg-sky-500/10 text-sky-500",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span className={cn(badgeVariants({ variant, className }))} {...props} />
  );
}
