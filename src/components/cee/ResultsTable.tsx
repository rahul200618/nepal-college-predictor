import { useState, useMemo } from "react";
import { Building2, ArrowUpDown, Award, Users } from "lucide-react";
import { ChanceBadge } from "./ChanceBadge";
import { cn } from "@/lib/utils";
import type { ResultRow } from "@/lib/predict.functions";
import type { ChanceLevel } from "@/lib/predictor";
import { getCollegeUniversity } from "@/lib/nepal-colleges-meta";

type SortField =
  | "college"
  | "university"
  | "seats"
  | "year"
  | "closing_rank"
  | "closing_marks"
  | "chance";
type SortDir = "asc" | "desc";

const CHANCE_ORDER: Record<ChanceLevel, number> = {
  HIGH: 0,
  MODERATE: 1,
  LOW: 2,
};

function CutoffProgressBar({
  closingRank,
  studentRank,
}: {
  closingRank: number;
  studentRank: number | null;
}) {
  if (studentRank === null) return null;

  const maxRank = Math.max(closingRank, studentRank) * 1.25;
  const studentPct = Math.min(96, Math.max(4, (studentRank / maxRank) * 100));
  const cutoffPct = Math.min(96, Math.max(4, (closingRank / maxRank) * 100));

  const isGood = studentRank <= closingRank;
  const isClose = studentRank <= closingRank * 1.15;

  return (
    <div className="w-full space-y-1">
      <div className="relative h-2 w-full max-w-[130px] rounded-full bg-secondary overflow-hidden border border-border/40">
        <div
          className="absolute top-0 bottom-0 left-0 bg-primary/20 border-r border-primary/50"
          style={{ width: `${cutoffPct}%` }}
        />
        <div
          className={cn(
            "absolute top-0 bottom-0 left-0 rounded-full transition-all",
            isGood ? "bg-success" : isClose ? "bg-warning" : "bg-danger",
          )}
          style={{ width: `${studentPct}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground max-w-[130px]">
        <span
          className={cn(
            "font-semibold",
            isGood ? "text-success" : isClose ? "text-warning-strong" : "text-danger",
          )}
        >
          {isGood ? "Safe" : isClose ? "Border" : "Stretch"}
        </span>
        <span>Cut: {closingRank.toLocaleString()}</span>
      </div>
    </div>
  );
}

export function ResultsTable({
  results,
  type,
  estimatedRank,
  collegeSeatsMap,
  category,
}: {
  results: ResultRow[];
  type: "scholarship" | "paying";
  estimatedRank?: number | null;
  collegeSeatsMap?: Map<string, number>;
  category?: string;
}) {
  const [sortField, setSortField] = useState<SortField>("chance");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const enrichedResults = useMemo(() => {
    return results.map((r) => {
      const u = getCollegeUniversity(r.college);
      const seats = collegeSeatsMap?.get(r.college) ?? null;
      return {
        ...r,
        univCode: u.code,
        univName: u.name,
        univBadge: u.badgeClass,
        totalSeats: seats,
      };
    });
  }, [results, collegeSeatsMap]);

  const sortedResults = useMemo(() => {
    return [...enrichedResults].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "college":
          cmp = a.college.localeCompare(b.college);
          break;
        case "university":
          cmp = a.univCode.localeCompare(b.univCode);
          break;
        case "seats":
          cmp = (a.totalSeats ?? 0) - (b.totalSeats ?? 0);
          break;
        case "year":
          cmp = a.year - b.year;
          break;
        case "closing_rank":
          cmp = a.closing_rank - b.closing_rank;
          break;
        case "closing_marks":
          cmp = (a.closing_marks ?? 0) - (b.closing_marks ?? 0);
          break;
        case "chance":
          cmp = CHANCE_ORDER[a.chance] - CHANCE_ORDER[b.chance];
          if (cmp === 0) cmp = a.closing_rank - b.closing_rank;
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [enrichedResults, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="size-3 opacity-40 ml-1 inline-block" />;
    }
    return (
      <span className="ml-1 text-[11px] font-bold text-white">
        {sortDir === "asc" ? "↑" : "↓"}
      </span>
    );
  };

  // Summary counts
  const highCount = results.filter((r) => r.chance === "HIGH").length;
  const modCount = results.filter((r) => r.chance === "MODERATE").length;
  const lowCount = results.filter((r) => r.chance === "LOW").length;

  if (results.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 bg-surface/50 p-8 text-center space-y-3">
        <div className="mx-auto size-12 rounded-full bg-muted/60 flex items-center justify-center">
          <Building2 className="size-5 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">
            No {type} cutoff records loaded yet for {category || "this category"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground max-w-md mx-auto">
            Official MEC admission lists for {type} seats in this program are published in rounds. Check the Paying seats tab or see the College Matrix below for all available colleges.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header chips: Chances summary + Quota badge */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {highCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-3 py-1 text-xs font-bold text-success">
              ✓ {highCount} High Chance
            </span>
          )}
          {modCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/30 bg-warning/10 px-3 py-1 text-xs font-bold text-warning-strong">
              ⚠ {modCount} Moderate Chance
            </span>
          )}
          {lowCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-danger/30 bg-danger/10 px-3 py-1 text-xs font-bold text-danger">
              ✕ {lowCount} Low Chance
            </span>
          )}
        </div>

        {category && (
          <div className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 border border-accent/20 px-3 py-1 text-xs font-semibold text-accent">
            <Award className="size-3.5" />
            <span>Quota: {category}</span>
          </div>
        )}
      </div>

      {/* Mobile cards */}
      <ul className="space-y-3.5 md:hidden">
        {sortedResults.map((r) => (
          <li
            key={r.id}
            className="rounded-xl border border-border/50 bg-card p-4 shadow-sm transition-shadow hover:shadow-md space-y-2.5"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-bold text-foreground text-sm leading-snug">{r.college}</p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold",
                      r.univBadge,
                    )}
                  >
                    {r.univCode}
                  </span>
                  <span>·</span>
                  <span>{r.year}</span>
                  <span>·</span>
                  <span>{r.round}</span>
                </div>
              </div>
              <ChanceBadge level={r.chance} />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/30">
              <div>
                <span className="text-muted-foreground block text-[11px]">Closing Rank</span>
                <strong className="tabular-nums text-foreground font-bold text-sm">
                  {r.closing_rank.toLocaleString("en-US")}
                </strong>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Closing Marks</span>
                <strong className="tabular-nums text-foreground font-bold text-sm">
                  {r.closing_marks === null ? "—" : r.closing_marks.toFixed(2)}
                </strong>
              </div>
            </div>

            {r.totalSeats !== null && (
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Users className="size-3" />
                <span>Total college seats: <strong>{r.totalSeats}</strong></span>
              </div>
            )}

            {estimatedRank !== undefined && (
              <CutoffProgressBar
                closingRank={r.closing_rank}
                studentRank={estimatedRank}
              />
            )}
          </li>
        ))}
      </ul>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-2xl border border-border/50 bg-card shadow-sm md:block">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="gradient-rank text-left text-white">
              <th
                className="px-5 py-3.5 font-bold rounded-tl-2xl cursor-pointer select-none hover:bg-white/10 transition-colors"
                onClick={() => toggleSort("college")}
              >
                College <SortIcon field="college" />
              </th>
              <th
                className="px-3.5 py-3.5 font-bold cursor-pointer select-none hover:bg-white/10 transition-colors"
                onClick={() => toggleSort("university")}
              >
                Univ <SortIcon field="university" />
              </th>
              <th
                className="px-3.5 py-3.5 text-right font-bold cursor-pointer select-none hover:bg-white/10 transition-colors"
                onClick={() => toggleSort("seats")}
              >
                Seats <SortIcon field="seats" />
              </th>
              <th
                className="px-3.5 py-3.5 font-bold cursor-pointer select-none hover:bg-white/10 transition-colors"
                onClick={() => toggleSort("year")}
              >
                Year/Round <SortIcon field="year" />
              </th>
              <th
                className="px-4 py-3.5 text-right font-bold cursor-pointer select-none hover:bg-white/10 transition-colors"
                onClick={() => toggleSort("closing_rank")}
              >
                Closing Rank <SortIcon field="closing_rank" />
              </th>
              <th
                className="px-4 py-3.5 text-right font-bold cursor-pointer select-none hover:bg-white/10 transition-colors"
                onClick={() => toggleSort("closing_marks")}
              >
                Closing Marks <SortIcon field="closing_marks" />
              </th>
              <th
                className="px-4 py-3.5 font-bold cursor-pointer select-none hover:bg-white/10 transition-colors"
                onClick={() => toggleSort("chance")}
              >
                Chance <SortIcon field="chance" />
              </th>
              <th className="px-4 py-3.5 font-bold rounded-tr-2xl">Cutoff Status</th>
            </tr>
          </thead>
          <tbody>
            {sortedResults.map((r, i) => (
              <tr
                key={r.id}
                className={cn(
                  i % 2 === 1 ? "bg-surface/30" : "bg-card",
                  "transition-colors hover:bg-accent/5 border-b border-border/20 last:border-0",
                )}
              >
                <td className="px-5 py-3.5 font-semibold text-foreground max-w-xs">
                  {r.college}
                </td>
                <td className="px-3.5 py-3.5">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-bold",
                      r.univBadge,
                    )}
                    title={r.univName}
                  >
                    {r.univCode}
                  </span>
                </td>
                <td className="px-3.5 py-3.5 text-right tabular-nums font-semibold text-foreground">
                  {r.totalSeats ?? "—"}
                </td>
                <td className="px-3.5 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                  {r.year} · {r.round}
                </td>
                <td className="px-4 py-3.5 text-right tabular-nums font-bold text-foreground">
                  {r.closing_rank.toLocaleString("en-US")}
                </td>
                <td className="px-4 py-3.5 text-right tabular-nums text-foreground">
                  {r.closing_marks === null ? "—" : r.closing_marks.toFixed(2)}
                </td>
                <td className="px-4 py-3.5">
                  <ChanceBadge level={r.chance} />
                </td>
                <td className="px-4 py-3.5 min-w-[140px]">
                  {estimatedRank !== undefined && (
                    <CutoffProgressBar
                      closingRank={r.closing_rank}
                      studentRank={estimatedRank}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
