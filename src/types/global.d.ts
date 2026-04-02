import type * as React from "react";

declare module "radix-ui" {
  export const Slot: {
    Root: React.ElementType;
  };
}
