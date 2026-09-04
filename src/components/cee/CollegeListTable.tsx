import { cn } from "@/lib/utils";
import type { CollegeRow } from "@/lib/predict.functions";

export function CollegeListTable({ colleges, program }: { colleges: CollegeRow[]; program: string }) {
  if (colleges.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border bg-surface p-6 text-center text-[13px] italic text-muted-foreground">
        The 2025/26 college list for {program} has not been loaded yet.
      </p>
    );
  }

  return (
    <>
      <ul className="space-y-3 md:hidden">
        {colleges.map((c) => (
          <li
            key={c.id}
            className={cn(
              "rounded-lg border border-border bg-card p-4",
              !c.historical_cutoff_loaded && "opacity-55",
            )}
          >
            <p className="font-semibold text-primary">{c.college}</p>
            <p className="text-[13px] text-muted-foreground">
              {c.type} · {c.district ?? "—"} · {c.seats_total} seats
            </p>
            <p className="mt-1 text-[13px] italic text-muted-foreground">
              {c.historical_cutoff_loaded ? "Cutoff data loaded" : "No historical cutoff yet"}
            </p>
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-primary text-left text-primary-foreground">
              <th className="px-4 py-3 font-semibold">College</th>
              <th className="px-4 py-3 font-semibold">Type</th>
              <th className="px-4 py-3 font-semibold">District</th>
              <th className="px-4 py-3 text-right font-semibold">Total seats</th>
              <th className="px-4 py-3 font-semibold">Historical cutoff</th>
            </tr>
          </thead>
          <tbody>
            {colleges.map((c, i) => (
              <tr
                key={c.id}
                className={cn(
                  i % 2 === 1 ? "bg-surface" : "bg-card",
                  !c.historical_cutoff_loaded && "text-muted-foreground opacity-70",
                )}
              >
                <td className="px-4 py-3 font-medium">{c.college}</td>
                <td className="px-4 py-3">{c.type}</td>
                <td className="px-4 py-3">{c.district ?? "—"}</td>
                <td className="px-4 py-3 text-right tabular-nums">{c.seats_total}</td>
                <td className="px-4 py-3">{c.historical_cutoff_loaded ? "Loaded" : "Not yet"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
