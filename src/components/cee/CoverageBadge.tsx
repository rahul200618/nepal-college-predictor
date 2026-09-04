import type { CoverageLevel } from "@/lib/predictor";
import { cn } from "@/lib/utils";

const STYLES: Record<CoverageLevel, string> = {
  Strong: "bg-success/12 text-success border-success/30",
  Partial: "bg-warning/15 text-warning-strong border-warning/40",
  None: "bg-danger/10 text-danger border-danger/30",
};

const LABELS: Record<CoverageLevel, string> = {
  Strong: "Verified data",
  Partial: "Partial data",
  None: "No data yet",
};

export function CoverageBadge({ level, className }: { level: CoverageLevel; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-semibold",
        STYLES[level],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {LABELS[level]}
    </span>
  );
}
