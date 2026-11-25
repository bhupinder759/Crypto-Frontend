"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { useTheme } from "next-themes";
import { Coins, Moon, Search, Sun } from "lucide-react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { routes } from "@/lib/constants/routes";
import { useSymbolsQuery } from "@/modules/market/hooks/use-market-data";
import { useUiStore } from "@/store/ui.store";
import { getNavItems } from "./nav-config";

export function CommandPaletteTrigger() {
  const setOpen = useUiStore((state) => state.setCommandOpen);

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="flex h-8 w-full max-w-xs items-center gap-2 rounded-md border border-border bg-card px-2.5 text-xs text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
    >
      <Search className="size-3.5" />
      <span className="flex-1 text-left">Search markets, pages…</span>
      <kbd className="hidden rounded border border-border bg-muted px-1 font-mono text-[10px] sm:inline">
        ⌘K
      </kbd>
    </button>
  );
}

export function CommandPalette({ role }: { role: string }) {
  const router = useRouter();
  const open = useUiStore((state) => state.commandOpen);
  const setOpen = useUiStore((state) => state.setCommandOpen);
  const { resolvedTheme, setTheme } = useTheme();
  const symbolsQuery = useSymbolsQuery();
  const symbols = symbolsQuery.data ?? [];

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen(!useUiStore.getState().commandOpen);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setOpen]);

  const go = (href: string) => {
    setOpen(false);
    router.push(href as Route);
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Command palette"
      description="Jump to a page or search a market"
    >
      <Command>
        <CommandInput placeholder="Search markets or pages…" />
        <CommandList>
          <CommandEmpty>
            {symbolsQuery.isLoading ? "Loading markets…" : "No results."}
          </CommandEmpty>
          <CommandGroup heading="Markets">
            {symbolsQuery.isError ? (
              <CommandItem disabled>Markets unavailable</CommandItem>
            ) : null}
            {symbols.map((symbol) => (
              <CommandItem
                key={symbol}
                value={`market ${symbol} ${symbol.replace("-", "")}`}
                onSelect={() =>
                  go(`${routes.trading}/${encodeURIComponent(symbol)}`)
                }
              >
                <Coins />
                <span className="font-medium">{symbol}</span>
                <CommandShortcut>Trade</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Pages">
            {getNavItems(role).map((item) => {
              const Icon = item.icon;
              return (
                <CommandItem
                  key={item.href}
                  value={`page ${item.label}`}
                  onSelect={() => go(item.href)}
                >
                  <Icon />
                  {item.label}
                </CommandItem>
              );
            })}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Preferences">
            <CommandItem
              value="toggle theme dark light"
              onSelect={() => {
                setTheme(resolvedTheme === "dark" ? "light" : "dark");
                setOpen(false);
              }}
            >
              {resolvedTheme === "dark" ? <Sun /> : <Moon />}
              Switch to {resolvedTheme === "dark" ? "light" : "dark"} theme
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
