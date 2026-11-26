import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type TimelineStep = {
  label: string;
  state: "done" | "current" | "pending" | "failed";
};

export function StatusTimeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <ol className="flex items-center gap-1" aria-label="Status">
      {steps.map((step, index) => (
        <li key={step.label} className="flex items-center gap-1">
          <span
            className={cn(
              "flex size-4 items-center justify-center rounded-full border text-[9px]",
              step.state === "done" && "border-buy bg-buy text-buy-foreground",
              step.state === "current" &&
                "animate-pulse border-warning text-warning",
              step.state === "pending" && "border-border text-muted-foreground",
              step.state === "failed" &&
                "border-sell bg-sell text-sell-foreground",
            )}
          >
            {step.state === "done" ? (
              <Check className="size-2.5" />
            ) : step.state === "failed" ? (
              <X className="size-2.5" />
            ) : (
              index + 1
            )}
          </span>
          <span
            className={cn(
              "text-[10px] whitespace-nowrap",
              step.state === "pending"
                ? "text-muted-foreground"
                : "text-foreground",
            )}
          >
            {step.label}
          </span>
          {index < steps.length - 1 ? (
            <span className="mx-0.5 h-px w-3 bg-border" />
          ) : null}
        </li>
      ))}
    </ol>
  );
}

export function depositSteps(
  confirmations: number,
  confirmed: boolean,
  required: number,
): TimelineStep[] {
  return [
    { label: "Detected", state: "done" },
    {
      label: `Confirming ${Math.min(confirmations, required)}/${required}`,
      state: confirmed || confirmations >= required ? "done" : "current",
    },
    { label: "Credited", state: confirmed ? "done" : "pending" },
  ];
}

export function withdrawalSteps(status: string): TimelineStep[] {
  const s = status.toUpperCase();
  const failed = s === "FAILED" || s === "REJECTED";
  return [
    { label: "Requested", state: "done" },
    {
      label: "Processing",
      state: s === "PENDING" ? "current" : "done",
    },
    {
      label: failed ? (s === "REJECTED" ? "Rejected" : "Failed") : "Completed",
      state:
        s === "COMPLETED"
          ? "done"
          : failed
            ? "failed"
            : s === "PROCESSING"
              ? "current"
              : "pending",
    },
  ];
}
