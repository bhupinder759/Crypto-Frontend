import Link from "next/link";
import {
  ArrowRight,
  CandlestickChart,
  ShieldCheck,
  Wallet,
  Zap,
} from "lucide-react";
import { AppLogo } from "@/components/common/app-logo";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { Button } from "@/components/ui/button";
import { DEFAULT_SYMBOL } from "@/lib/constants/config";
import { routes } from "@/lib/constants/routes";
import { LiveCandlestickChart } from "@/modules/market/components/live-candlestick-chart";

const highlights = [
  {
    icon: CandlestickChart,
    title: "Pro trading terminal",
    description:
      "Live candles, order book, recent trades and a fast order ticket on one screen.",
  },
  {
    icon: Zap,
    title: "Real-time by default",
    description:
      "Prices, depth and order status stream over WebSockets — no refresh needed.",
  },
  {
    icon: Wallet,
    title: "Demo and real accounts",
    description:
      "Practice with virtual funds, then switch to a real account in one click.",
  },
  {
    icon: ShieldCheck,
    title: "Secure sessions",
    description:
      "HTTP-only cookie sessions, protected routes and role-based admin tools.",
  },
];

export default function Home() {
  return (
    <div className="min-h-svh bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-12 max-w-6xl items-center justify-between gap-2 px-4">
          <AppLogo href={routes.home} />
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <Button variant="ghost" size="sm" asChild>
              <Link href={routes.login}>Log in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href={routes.register}>Sign up</Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl space-y-10 px-4 py-10 lg:py-16">
        <section className="grid items-center gap-8 lg:grid-cols-[1fr_1.1fr]">
          <div className="space-y-5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground">
              <span className="size-1.5 rounded-full bg-buy" />
              Spot markets · Demo funds included
            </span>
            <h1 className="font-heading text-4xl font-semibold leading-tight tracking-tight lg:text-5xl">
              Trade crypto with a{" "}
              <span className="text-primary">professional-grade</span>{" "}
              terminal.
            </h1>
            <p className="max-w-lg text-base text-muted-foreground">
              Real-time charts and order books, limit and market orders, and a
              portfolio view that updates as you trade.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="lg" asChild>
                <Link href={routes.register}>
                  Start trading <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href={routes.login}>I have an account</Link>
              </Button>
            </div>
          </div>
          <LiveCandlestickChart
            symbol={DEFAULT_SYMBOL}
            interval="1m"
            title={DEFAULT_SYMBOL}
            height={300}
            persistPreferences={false}
            showTools={false}
          />
        </section>
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {highlights.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="space-y-2 rounded-lg border border-border bg-card p-4"
              >
                <Icon className="size-5 text-primary" />
                <h2 className="text-sm font-semibold">{item.title}</h2>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
            );
          })}
        </section>
      </main>
      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-4 text-xs text-muted-foreground">
          Nexfin is a portfolio project. Demo balances are virtual.
        </div>
      </footer>
    </div>
  );
}
