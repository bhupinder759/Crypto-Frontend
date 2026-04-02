"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { Route } from "next";
import {
  Bell,
  CandlestickChart,
  CreditCard,
  LayoutDashboard,
  RefreshCcw,
  Settings,
  Wallet,
} from "lucide-react";
import { AppLogo } from "@/components/common/app-logo";
import { LogoutButton } from "@/components/common/logout-button";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { routes } from "@/lib/constants/routes";
import type { SessionPayload } from "@/modules/auth/types";

const navigation = [
  { href: routes.dashboard, matcher: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: `${routes.trading}/BTC-USD`, matcher: "/trading", label: "Trading", icon: CandlestickChart },
  { href: routes.wallet, matcher: "/wallet", label: "Wallet", icon: Wallet },
  { href: routes.orders, matcher: "/orders", label: "Orders", icon: CreditCard },
  { href: routes.settings, matcher: "/settings", label: "Settings", icon: Settings },
];

export function DashboardShell({
  session,
  children,
}: {
  session: SessionPayload;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(18,198,194,0.12),_transparent_28%),linear-gradient(180deg,rgba(6,16,32,0.02),transparent_30%)]">
      <div className="mx-auto grid min-h-screen w-full max-w-[1680px] grid-cols-1 lg:grid-cols-[260px_1fr]">
        <aside className="border-r border-border/60 bg-background/80 px-4 py-6 backdrop-blur xl:px-6">
          <AppLogo />
          <nav className="mt-10 space-y-1">
            {navigation.map((item) => {
              const active =
                pathname === item.matcher || pathname.startsWith(`${item.matcher}/`);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href as Route}
                  prefetch
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition",
                    active
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/15"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <div className="flex min-h-screen flex-col">
          <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border/60 bg-background/85 px-4 py-4 backdrop-blur xl:px-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                Role
              </p>
              <p className="font-medium text-foreground">{session.user.role}</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" aria-label="Notifications">
                <Bell className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label="Refresh dashboard"
                onClick={() => router.refresh()}
              >
                <RefreshCcw className="size-4" />
              </Button>
              <ThemeToggle />
              <LogoutButton />
              <div className="rounded-2xl border border-border/60 bg-card px-4 py-2 text-right">
                <p className="text-sm font-medium text-foreground">
                  {session.user.email}
                </p>
                <p className="text-xs text-muted-foreground">
                  Account {session.account?.id ?? "not created"}
                </p>
              </div>
            </div>
          </header>
          <main className="flex-1 px-4 py-6 xl:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
