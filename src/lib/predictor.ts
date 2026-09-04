export type ChanceLevel = "HIGH" | "MODERATE" | "LOW";
export type CoverageLevel = "Strong" | "Partial" | "None";

export interface CurvePoint {
  marks: number;
  estimated_rank: number;
}

/**
 * Linearly interpolate a CEE score against a course's marks -> rank curve.
 * The curve is sorted ascending by marks; ranks fall as marks rise.
 * Values outside the curve are clamped to its floor / ceiling rank.
 * Returns null when there are no usable curve points.
 */
export function estimateRank(marks: number, curve: CurvePoint[]): number | null {
  const points = [...curve]
    .filter((p) => Number.isFinite(p.marks) && Number.isFinite(p.estimated_rank))
    .sort((a, b) => a.marks - b.marks);

  if (points.length === 0) return null;
  if (points.length === 1) return Math.round(points[0]!.estimated_rank);

  const first = points[0]!;
  const last = points[points.length - 1]!;

  if (marks <= first.marks) return Math.round(first.estimated_rank);
  if (marks >= last.marks) return Math.round(last.estimated_rank);

  for (let i = 0; i < points.length - 1; i++) {
    const lo = points[i]!;
    const hi = points[i + 1]!;
    if (marks >= lo.marks && marks <= hi.marks) {
      const span = hi.marks - lo.marks;
      if (span === 0) return Math.round(lo.estimated_rank);
      const t = (marks - lo.marks) / span;
      return Math.round(lo.estimated_rank + t * (hi.estimated_rank - lo.estimated_rank));
    }
  }

  return Math.round(last.estimated_rank);
}

/**
 * HIGH      — estimated rank is at or better than the closing rank
 * MODERATE  — estimated rank is within 20% above the closing rank
 * LOW       — estimated rank is beyond 120% of the closing rank
 */
export function getChance(estimatedRank: number, closingRank: number): ChanceLevel {
  if (!Number.isFinite(closingRank) || closingRank <= 0) return "LOW";
  if (estimatedRank <= closingRank) return "HIGH";
  if (estimatedRank <= closingRank * 1.2) return "MODERATE";
  return "LOW";
}

const CHANCE_ORDER: Record<ChanceLevel, number> = { HIGH: 0, MODERATE: 1, LOW: 2 };

export function compareChance(a: ChanceLevel, b: ChanceLevel): number {
  return CHANCE_ORDER[a] - CHANCE_ORDER[b];
}
