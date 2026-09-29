import { AlertTriangle, TrendingUp, Award, Target } from "lucide-react";
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
    <section className="overflow-hidden rounded-2xl border border-border/30 bg-card shadow-xl">
      <div className="gradient-rank px-6 py-6 sm:px-8 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 size-40 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-1/2 size-28 rounded-full bg-white/3 translate-y-1/2" />

        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <Target className="size-4 text-white/70" />
            <p className="text-[13px] uppercase tracking-[1px] font-semibold text-white/70">
              Estimated Rank
            </p>
          </div>

          <div className="flex flex-wrap items-baseline gap-3">
            {estimatedRankRange ? (
              <span className="text-4xl font-extrabold tabular-nums text-white sm:text-5xl tracking-tight">
                {estimatedRankRange[0].toLocaleString("en-US")} –{" "}
                {estimatedRankRange[1].toLocaleString("en-US")}
              </span>
            ) : (
              <span className="text-5xl font-extrabold tabular-nums text-white sm:text-6xl tracking-tight">
                {estimatedRank === null
                  ? "N/A"
                  : estimatedRank.toLocaleString("en-US")}
              </span>
            )}
            {(estimatedRank !== null || estimatedRankRange !== null) && (
              <span className="text-sm font-medium text-white/60">
                overall in {course}
              </span>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-white/80">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[12px] font-medium backdrop-blur-sm">
              <Award className="size-3" />
              {course}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[12px] font-medium backdrop-blur-sm">
              {category}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[12px] font-medium backdrop-blur-sm tabular-nums">
              <TrendingUp className="size-3" />
              {marks.toFixed(2)} marks
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3 px-6 py-5 sm:px-8">
        <div className="flex flex-wrap items-center gap-2">
          <CoverageBadge level={coverage} />
          {!curveVerified && estimatedRankRange === null && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/40 bg-warning/10 px-2.5 py-1 text-[12px] font-semibold text-warning-strong">
              <AlertTriangle className="size-3.5" aria-hidden />
              Curve not verified — estimate only
            </span>
          )}
          {estimatedRankRange !== null && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/40 bg-warning/10 px-2.5 py-1 text-[12px] font-semibold text-warning-strong">
              <AlertTriangle className="size-3.5" aria-hidden />
              Proxy range estimate
            </span>
          )}
        </div>
        {estimatedRank === null && estimatedRankRange === null && (
          <p className="text-[13px] text-muted-foreground">
            No marks-to-rank curve has been published for this program yet, so a
            rank cannot be estimated. The cutoff tables below still show past
            admission data.
          </p>
        )}
        {estimatedRankRange !== null && (
          <p className="text-[13px] text-muted-foreground">
            There is no specific curve available for this program. This is a
            proxy range calculated using other available CEE curves to give you a
            rough idea of your standing.
          </p>
        )}
        {children}
      </div>
    </section>
  );
}
