"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { AppLogo } from "@/components/common/app-logo";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/ui.store";
import { getNavItems, isNavActive, type NavItem } from "./nav-config";

export function NavLink({
  item,
  active,
  collapsed = false,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  const link = (
    <Link
      href={item.href as Route}
      prefetch
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex h-9 items-center gap-3 rounded-md px-2.5 text-sm font-medium transition-colors",
        collapsed && "justify-center px-0",
        active
          ? "bg-accent text-foreground"
          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
      )}
    >
      {active ? (
        <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-primary" />
      ) : null}
      <Icon className={cn("size-4 shrink-0", active && "text-primary")} />
      {collapsed ? (
        <span className="sr-only">{item.label}</span>
      ) : (
        <span className="truncate">{item.label}</span>
      )}
    </Link>
  );

  if (!collapsed) return link;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  );
}

export function AppSidebar({ role }: { role: string }) {
  const pathname = usePathname();
  const collapsed = useUiStore((state) => state.sidebarCollapsed);
  const toggle = useUiStore((state) => state.toggleSidebar);
  const items = getNavItems(role);

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-svh shrink-0 flex-col border-r border-border bg-sidebar transition-[width] duration-200 lg:flex",
        collapsed ? "w-14" : "w-52",
      )}
    >
      <div
        className={cn(
          "flex h-12 items-center border-b border-border px-3",
          collapsed && "justify-center px-0",
        )}
      >
        <AppLogo compact={collapsed} />
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 p-2" aria-label="Main">
        {items.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            collapsed={collapsed}
            active={isNavActive(pathname, item.matcher)}
          />
        ))}
      </nav>
      <div className="border-t border-border p-2">
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "flex h-8 w-full items-center gap-2 rounded-md px-2.5 text-xs text-muted-foreground hover:bg-accent/60 hover:text-foreground",
            collapsed && "justify-center px-0",
          )}
        >
          {collapsed ? (
            <PanelLeftOpen className="size-4" />
          ) : (
            <>
              <PanelLeftClose className="size-4" />
              Collapse
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
