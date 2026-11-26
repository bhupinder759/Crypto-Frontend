"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import { Menu } from "lucide-react";
import { AppLogo } from "@/components/common/app-logo";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/ui.store";
import { NavLink } from "./app-sidebar";
import { getNavItems, isNavActive } from "./nav-config";

export function MobileNavDrawer({ role }: { role: string }) {
  const pathname = usePathname();
  const open = useUiStore((state) => state.mobileNavOpen);
  const setOpen = useUiStore((state) => state.setMobileNavOpen);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Open menu"
          className="lg:hidden"
        >
          <Menu className="size-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 gap-0 p-0">
        <SheetHeader className="h-12 justify-center border-b border-border px-3">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <AppLogo />
        </SheetHeader>
        <nav className="flex flex-col gap-0.5 p-2" aria-label="Main">
          {getNavItems(role).map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={isNavActive(pathname, item.matcher)}
              onNavigate={() => setOpen(false)}
            />
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}

export function MobileBottomNav({ role }: { role: string }) {
  const pathname = usePathname();
  const items = getNavItems(role).filter((item) => item.primary);

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 grid border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
    >
      {items.map((item) => {
        const active = isNavActive(pathname, item.matcher);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href as Route}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium",
              active ? "text-primary" : "text-muted-foreground",
            )}
          >
            <Icon className="size-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
