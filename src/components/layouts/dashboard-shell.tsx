"use client";

import { useEffect } from "react";
import { AppLogo } from "@/components/common/app-logo";
import { TradingModeToggle } from "@/components/common/trading-mode-toggle";
import type { SessionPayload } from "@/modules/auth/types";
import { AppSidebar } from "./app-sidebar";
import { CommandPalette, CommandPaletteTrigger } from "./command-palette";
import { ConnectionStatus } from "./connection-status";
import { MobileBottomNav, MobileNavDrawer } from "./mobile-nav";
import { NotificationsPopover } from "./notifications-popover";
import { TickerTape } from "./ticker-tape";
import { UserMenu } from "./user-menu";
import { useUiStore } from "@/store/ui.store";

export function DashboardShell({
  session,
  children,
}: {
  session: SessionPayload;
  children: React.ReactNode;
}) {
  const role = session.user.role;

  useEffect(() => {
    void useUiStore.persist.rehydrate();
  }, []);

  return (
    <div className="flex min-h-svh bg-background">
      <AppSidebar role={role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
          <div className="flex min-h-12 flex-wrap items-center gap-2 px-3 py-1.5 lg:px-4">
            <MobileNavDrawer role={role} />
            <AppLogo compact className="lg:hidden" />
            <div className="order-last w-full sm:order-none sm:w-auto sm:flex-1">
              <CommandPaletteTrigger />
            </div>
            <div className="ml-auto flex items-center gap-1.5 sm:ml-0">
              <ConnectionStatus />
              <TradingModeToggle
                initialMode={session.tradingMode}
                realAccount={session.realAccount}
                demoAccount={session.demoAccount}
              />
              <NotificationsPopover />
              <UserMenu session={session} />
            </div>
          </div>
          <TickerTape />
        </header>
        <main className="flex-1 px-3 py-4 pb-20 lg:px-4 lg:pb-6">
          {children}
        </main>
      </div>
      <MobileBottomNav role={role} />
      <CommandPalette role={role} />
    </div>
  );
}
