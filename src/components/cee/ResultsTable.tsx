import { ExternalLink } from "lucide-react";
import { ChanceBadge } from "./ChanceBadge";
import type { ResultRow } from "@/lib/predict.functions";

export function ResultsTable({ results, type }: { results: ResultRow[]; type: "scholarship" | "paying" }) {
  if (results.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border bg-surface p-6 text-center text-[13px] italic text-muted-foreground">
        No {type} cutoff data loaded yet for this course and category.
      </p>
    );
  }

  return (
    <>
      {/* Mobile cards */}
      <ul className="space-y-3 md:hidden">
        {results.map((r) => (
          <li key={r.id} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-primary">{r.college}</p>
                <p className="text-[13px] text-muted-foreground">
                  {r.university ?? "—"} · {r.year} · {r.round}
                </p>
              </div>
              <ChanceBadge level={r.chance} />
            </div>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
              <span>
                Closing rank{" "}
                <strong className="tabular-nums">{r.closing_rank.toLocaleString("en-US")}</strong>
              </span>
              <span>
                Closing marks{" "}
                <strong className="tabular-nums">
                  {r.closing_marks === null ? "—" : r.closing_marks.toFixed(2)}
                </strong>
              </span>
            </div>
            {r.source_url && (
              <a
                href={r.source_url}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-[13px] text-accent hover:underline"
              >
                Source <ExternalLink className="size-3" aria-hidden />
              </a>
            )}
          </li>
        ))}
      </ul>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-primary text-left text-primary-foreground">
              <th className="px-4 py-3 font-semibold">College</th>
              <th className="px-4 py-3 font-semibold">University</th>
              <th className="px-4 py-3 font-semibold">Year</th>
              <th className="px-4 py-3 text-right font-semibold">Closing rank</th>
              <th className="px-4 py-3 text-right font-semibold">Closing marks</th>
              <th className="px-4 py-3 font-semibold">Round</th>
              <th className="px-4 py-3 font-semibold">Chance</th>
              <th className="px-4 py-3 font-semibold">Source</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r, i) => (
              <tr key={r.id} className={i % 2 === 1 ? "bg-surface" : "bg-card"}>
                <td className="px-4 py-3 font-medium text-primary">{r.college}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.university ?? "—"}</td>
                <td className="px-4 py-3 tabular-nums">{r.year}</td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {r.closing_rank.toLocaleString("en-US")}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {r.closing_marks === null ? "—" : r.closing_marks.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{r.round}</td>
                <td className="px-4 py-3">
                  <ChanceBadge level={r.chance} />
                </td>
                <td className="px-4 py-3">
                  {r.source_url ? (
                    <a
                      href={r.source_url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Source PDF for ${r.college}`}
                      className="inline-flex items-center gap-1 text-accent hover:underline"
                    >
                      PDF <ExternalLink className="size-3" aria-hidden />
                    </a>
                  ) : (
                    <span className="text-muted-foreground">—</span>
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
