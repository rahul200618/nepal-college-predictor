import type { ChanceLevel } from "@/lib/predictor";
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertCircle, XCircle } from "lucide-react";

const STYLES: Record<ChanceLevel, string> = {
  HIGH: "bg-success/12 text-success border-success/25",
  MODERATE: "bg-warning/12 text-warning-strong border-warning/25",
  LOW: "bg-danger/12 text-danger border-danger/25",
};

const LABELS: Record<ChanceLevel, string> = {
  HIGH: "High",
  MODERATE: "Moderate",
  LOW: "Low",
};

const ICONS: Record<ChanceLevel, React.ElementType> = {
  HIGH: CheckCircle2,
  MODERATE: AlertCircle,
  LOW: XCircle,
};

export function ChanceBadge({
  level,
  className,
}: {
  level: ChanceLevel;
  className?: string;
}) {
  const Icon = ICONS[level];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-bold uppercase tracking-[0.3px] whitespace-nowrap",
        STYLES[level],
        className,
      )}
    >
      <Icon className="size-3" aria-hidden />
      {LABELS[level]}
    </span>
  );
}
