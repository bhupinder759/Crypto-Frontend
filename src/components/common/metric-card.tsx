import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function MetricCard({
  title,
  value,
  delta,
  tone = "neutral",
}: {
  title: string;
  value: string;
  delta?: string;
  tone?: "positive" | "negative" | "neutral";
}) {
  const isPositive = tone === "positive";
  const isNegative = tone === "negative";

  return (
    <Card className="border border-border/60 bg-card/90 backdrop-blur">
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
      {delta ? (
        <CardContent
          className={cn(
            "flex items-center gap-2 text-sm",
            isPositive && "text-emerald-500",
            isNegative && "text-rose-500",
            !isPositive && !isNegative && "text-muted-foreground",
          )}
        >
          {isPositive ? (
            <ArrowUpRight className="size-4" />
          ) : isNegative ? (
            <ArrowDownRight className="size-4" />
          ) : null}
          {delta}
        </CardContent>
      ) : null}
    </Card>
  );
}
