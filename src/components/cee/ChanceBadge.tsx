import type { ChanceLevel } from "@/lib/predictor";
import { cn } from "@/lib/utils";

const STYLES: Record<ChanceLevel, string> = {
  HIGH: "bg-success text-success-foreground",
  MODERATE: "bg-warning text-warning-foreground",
  LOW: "bg-danger text-danger-foreground",
};

const LABELS: Record<ChanceLevel, string> = {
  HIGH: "High chance",
  MODERATE: "Moderate",
  LOW: "Low chance",
};

export function ChanceBadge({ level, className }: { level: ChanceLevel; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-bold uppercase tracking-[0.5px] whitespace-nowrap",
        STYLES[level],
        className,
      )}
    >
      {LABELS[level]}
    </span>
  );
}
