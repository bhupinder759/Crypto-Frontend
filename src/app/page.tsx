import Link from "next/link";
import { ArrowRight, ShieldCheck, Waves, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppLogo } from "@/components/common/app-logo";
import { routes } from "@/lib/constants/routes";
import { LiveCandlestickChart } from "@/modules/market/components/live-candlestick-chart";

const highlights = [
  {
    icon: Waves,
    title: "Realtime execution surface",
    description:
      "Live order books, recent trades, and fast order entry wired to the existing exchange backend.",
  },
  {
    icon: Wallet,
    title: "Wallet operations",
    description:
      "Portfolio balances, mock deposits, withdrawals, and operational history in one secure dashboard.",
  },
  {
    icon: ShieldCheck,
    title: "BFF-first security",
    description:
      "HTTP-only cookie session handling, protected routes, and backend role-aware workflows.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(8,145,178,0.18),_transparent_28%),linear-gradient(180deg,rgba(15,23,42,0.02),transparent_50%)]">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-8 lg:px-8">
        <header className="flex items-center justify-between">
          <AppLogo />
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href={routes.login}>Login</Link>
            </Button>
            <Button asChild>
              <Link href={routes.register}>Open account</Link>
            </Button>
          </div>
        </header>
        <main className="grid flex-1 items-center gap-10 py-14 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-8">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary">
                Enterprise Exchange Frontend
              </p>
              <h1 className="max-w-4xl font-heading text-5xl font-semibold leading-tight lg:text-7xl">
                Operate trading, wallet, and market workflows from one fintech-grade surface.
              </h1>
              <p className="max-w-2xl text-lg text-muted-foreground">
                Next.js App Router frontend with secure BFF integration, responsive exchange screens, and real-time streaming against the existing NestJS backend.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button className="h-11 px-5" asChild>
                <Link href={routes.register}>
                  Launch dashboard <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button className="h-11 px-5" variant="outline" asChild>
                <Link href={routes.login}>Use existing account</Link>
              </Button>
            </div>
          </section>
          <section className="grid gap-4">
            {highlights.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.title} className="border border-border/70 bg-card/85 shadow-xl shadow-slate-950/5 backdrop-blur">
                  <CardHeader className="flex flex-row items-center gap-4">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <CardTitle>{item.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    {item.description}
                  </CardContent>
                </Card>
              );
            })}
          </section>
        </main>
        <section className="py-10">
          <LiveCandlestickChart
            symbol="BTC-USD"
            interval="1m"
            title="Live BTC-USD Stream"
            height={320}
          />
        </section>
      </div>
    </div>
  );
}
