import { AlertTriangle } from "lucide-react";
import { CoverageBadge } from "./CoverageBadge";
import type { CoverageLevel } from "@/lib/predictor";

export function RankCard({
  estimatedRank,
  estimatedRankRange,
  course,
  category,
  marks,
  coverage,
  curveVerified,
  children,
}: {
  estimatedRank: number | null;
  estimatedRankRange: [number, number] | null;
  course: string;
  category: string;
  marks: number;
  coverage: CoverageLevel;
  curveVerified: boolean;
  children?: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-primary/20 bg-card shadow-sm">
      <div className="bg-primary px-5 py-4 text-primary-foreground sm:px-7">
        <p className="text-[13px] uppercase tracking-[0.5px] opacity-80">Estimated rank</p>
        <div className="mt-1 flex flex-wrap items-baseline gap-3">
          {estimatedRankRange ? (
            <span className="text-4xl font-bold tabular-nums sm:text-5xl">
              {estimatedRankRange[0].toLocaleString("en-US")} -{" "}
              {estimatedRankRange[1].toLocaleString("en-US")}
            </span>
          ) : (
            <span className="text-5xl font-bold tabular-nums sm:text-6xl">
              {estimatedRank === null ? "N/A" : estimatedRank.toLocaleString("en-US")}
            </span>
          )}
          {(estimatedRank !== null || estimatedRankRange !== null) && (
            <span className="text-sm opacity-80">overall in {course}</span>
          )}
        </div>
        <p className="mt-2 text-sm opacity-90">
          {course} · {category} · {marks.toFixed(2)} marks
        </p>
      </div>

      <div className="space-y-3 px-5 py-4 sm:px-7">
        <div className="flex flex-wrap items-center gap-2">
          <CoverageBadge level={coverage} />
          {!curveVerified && estimatedRankRange === null && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/40 bg-warning/15 px-2.5 py-1 text-[12px] font-semibold text-warning-strong">
              <AlertTriangle className="size-3.5" aria-hidden />
              Curve not verified — estimate only
            </span>
          )}
          {estimatedRankRange !== null && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/40 bg-warning/15 px-2.5 py-1 text-[12px] font-semibold text-warning-strong">
              <AlertTriangle className="size-3.5" aria-hidden />
              Proxy range estimate
            </span>
          )}
        </div>
        {estimatedRank === null && estimatedRankRange === null && (
          <p className="text-[13px] italic text-muted-foreground">
            No marks-to-rank curve has been published for this program yet, so a rank cannot be
            estimated. The cutoff tables below still show past admission data.
          </p>
        )}
        {estimatedRankRange !== null && (
          <p className="text-[13px] italic text-muted-foreground">
            There is no specific curve available for this program. This is a proxy range calculated
            using other available CEE curves to give you a rough idea of your standing.
          </p>
        )}
        {children}
      </div>
    </section>
  );
}
