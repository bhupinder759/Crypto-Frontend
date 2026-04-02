import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppLogo } from "@/components/common/app-logo";

export function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen grid-cols-1 bg-[radial-gradient(circle_at_top_left,_rgba(6,182,212,0.18),_transparent_25%),radial-gradient(circle_at_bottom_right,_rgba(245,158,11,0.12),_transparent_20%)] lg:grid-cols-[1.1fr_0.9fr]">
      <div className="hidden flex-col justify-between border-r border-border/50 bg-slate-950 px-10 py-12 text-slate-50 lg:flex">
        <AppLogo className="text-white [&_span:last-child]:text-white" />
        <div className="space-y-6">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300">
              Enterprise Trading Surface
            </p>
            <h1 className="max-w-xl font-heading text-5xl font-semibold leading-tight">
              Institutional-grade crypto trading, wallet operations, and market visibility.
            </h1>
          </div>
          <p className="max-w-lg text-sm text-slate-300">
            Built for secure execution, real-time market streaming, and operations workflows across desktop, tablet, and mobile.
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md border border-border/60 bg-background/95 shadow-2xl shadow-slate-950/10 backdrop-blur">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl">{title}</CardTitle>
            <p className="text-sm text-muted-foreground">{description}</p>
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
      </div>
    </div>
  );
}
