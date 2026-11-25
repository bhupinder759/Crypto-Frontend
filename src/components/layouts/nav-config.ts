import {
  CandlestickChart,
  LayoutDashboard,
  ListOrdered,
  Settings,
  ShieldCheck,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { DEFAULT_SYMBOL } from "@/lib/constants/config";
import { routes } from "@/lib/constants/routes";

export type NavItem = {
  href: string;
  matcher: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
  /** Shown in the mobile bottom bar. */
  primary?: boolean;
};

export const navItems: NavItem[] = [
  {
    href: routes.dashboard,
    matcher: "/dashboard",
    label: "Overview",
    icon: LayoutDashboard,
    primary: true,
  },
  {
    href: `${routes.trading}/${DEFAULT_SYMBOL}`,
    matcher: "/trading",
    label: "Trade",
    icon: CandlestickChart,
    primary: true,
  },
  {
    href: routes.orders,
    matcher: "/orders",
    label: "Orders",
    icon: ListOrdered,
    primary: true,
  },
  {
    href: routes.wallet,
    matcher: "/wallet",
    label: "Wallet",
    icon: Wallet,
    primary: true,
  },
  {
    href: routes.settings,
    matcher: "/settings",
    label: "Settings",
    icon: Settings,
  },
  {
    href: routes.admin,
    matcher: "/admin",
    label: "Admin",
    icon: ShieldCheck,
    adminOnly: true,
  },
];

export function getNavItems(role: string) {
  return navItems.filter((item) => !item.adminOnly || role === "ADMIN");
}

export function isNavActive(pathname: string, matcher: string) {
  return pathname === matcher || pathname.startsWith(`${matcher}/`);
}
