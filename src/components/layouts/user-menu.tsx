"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { useTheme } from "next-themes";
import { LogOut, Monitor, Moon, Settings, ShieldCheck, Sun } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { routes } from "@/lib/constants/routes";
import { useLogoutMutation } from "@/modules/auth/hooks/use-auth-session";
import type { SessionPayload } from "@/modules/auth/types";

export function UserMenu({ session }: { session: SessionPayload }) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const logoutMutation = useLogoutMutation();
  const email = session.user.email;
  const initials = email.slice(0, 2).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Account menu"
          className="flex size-8 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground ring-1 ring-border transition hover:ring-primary/60"
        >
          {initials}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="flex flex-col gap-1 font-normal">
          <span className="truncate text-sm font-medium text-foreground">
            {email}
          </span>
          <span className="flex items-center gap-1.5">
            <Badge variant="default" className="h-5 px-1.5 text-[10px]">
              {session.user.role}
            </Badge>
            <Badge variant="info" className="h-5 px-1.5 text-[10px]">
              {session.tradingMode}
            </Badge>
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href={routes.settings as Route}>
              <Settings />
              Settings
            </Link>
          </DropdownMenuItem>
          {session.user.role === "ADMIN" ? (
            <DropdownMenuItem asChild>
              <Link href={routes.admin as Route}>
                <ShieldCheck />
                Admin console
              </Link>
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Moon />
              Theme
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup
                value={theme ?? "dark"}
                onValueChange={setTheme}
              >
                <DropdownMenuRadioItem value="dark">
                  <Moon />
                  Dark
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="light">
                  <Sun />
                  Light
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="system">
                  <Monitor />
                  System
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          disabled={logoutMutation.isPending}
          onSelect={async (event) => {
            event.preventDefault();
            await logoutMutation.mutateAsync();
            router.replace(routes.login);
            router.refresh();
          }}
        >
          <LogOut />
          {logoutMutation.isPending ? "Signing out…" : "Log out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
