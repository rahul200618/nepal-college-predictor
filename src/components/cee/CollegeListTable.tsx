import { cn } from "@/lib/utils";
import { Building2, MapPin } from "lucide-react";
import type { CollegeRow } from "@/lib/predict.functions";

export function CollegeListTable({
  colleges,
  program,
}: {
  colleges: CollegeRow[];
  program: string;
}) {
  if (colleges.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 bg-surface/50 p-8 text-center">
        <div className="mx-auto size-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
          <Building2 className="size-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">
          The 2025/26 college list for {program} has not been loaded yet.
        </p>
      </div>
    );
  }

  return (
    <>
      <ul className="space-y-3 md:hidden">
        {colleges.map((c) => (
          <li
            key={c.id}
            className={cn(
              "rounded-xl border border-border/50 bg-card p-4 shadow-sm transition-all hover:shadow-md",
              !c.historical_cutoff_loaded && "opacity-55",
            )}
          >
            <p className="font-bold text-foreground">{c.college}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                  c.type === "Public"
                    ? "bg-success/10 text-success"
                    : "bg-accent/10 text-accent",
                )}
              >
                {c.type}
              </span>
              {c.district && (
                <span className="inline-flex items-center gap-1 text-[12px] text-muted-foreground">
                  <MapPin className="size-3" />
                  {c.district}
                </span>
              )}
              <span className="text-[12px] font-semibold text-foreground">
                {c.seats_total} seats
              </span>
            </div>
            <p className="mt-1.5 text-[12px] text-muted-foreground">
              {c.historical_cutoff_loaded
                ? "✓ Cutoff data loaded"
                : "No historical cutoff yet"}
            </p>
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto rounded-xl border border-border/50 bg-card shadow-sm md:block">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="gradient-rank text-left text-white">
              <th className="px-5 py-3.5 font-semibold rounded-tl-xl">
                College
              </th>
              <th className="px-5 py-3.5 font-semibold">Type</th>
              <th className="px-5 py-3.5 font-semibold">District</th>
              <th className="px-5 py-3.5 text-right font-semibold">
                Total seats
              </th>
              <th className="px-5 py-3.5 font-semibold rounded-tr-xl">
                Historical cutoff
              </th>
            </tr>
          </thead>
          <tbody>
            {colleges.map((c, i) => (
              <tr
                key={c.id}
                className={cn(
                  i % 2 === 1 ? "bg-surface/40" : "bg-card",
                  "transition-colors hover:bg-accent/5",
                  !c.historical_cutoff_loaded &&
                    "text-muted-foreground opacity-60",
                )}
              >
                <td className="px-5 py-3.5 font-semibold">{c.college}</td>
                <td className="px-5 py-3.5">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
                      c.type === "Public"
                        ? "bg-success/10 text-success"
                        : "bg-accent/10 text-accent",
                    )}
                  >
                    {c.type}
                  </span>
                </td>
                <td className="px-5 py-3.5">{c.district ?? "—"}</td>
                <td className="px-5 py-3.5 text-right tabular-nums font-semibold">
                  {c.seats_total}
                </td>
                <td className="px-5 py-3.5">
                  {c.historical_cutoff_loaded ? (
                    <span className="inline-flex items-center gap-1 text-success text-[12px] font-semibold">
                      ✓ Loaded
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-[12px]">
                      Not yet
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
