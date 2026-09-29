export type ChanceLevel = "HIGH" | "MODERATE" | "LOW";
export type CoverageLevel = "Strong" | "Partial" | "None";

export interface CurvePoint {
  marks: number;
  estimated_rank: number;
}

/**
 * Standard MECEE percentile model if no curve points are available for a program.
 * Full marks: 200, Qualifying: 50. Total candidates: ~12,000 - 15,000.
 */
function defaultMeceeRank(marks: number): number {
  const m = Math.max(0, Math.min(200, marks));
  if (m >= 185) return Math.max(1, Math.round(1 + (200 - m) * 2));
  if (m >= 150) return Math.round(10 + Math.pow((185 - m) / 35, 1.8) * 150);
  if (m >= 120) return Math.round(160 + Math.pow((150 - m) / 30, 1.5) * 600);
  if (m >= 90) return Math.round(760 + Math.pow((120 - m) / 30, 1.3) * 1100);
  if (m >= 60) return Math.round(1860 + Math.pow((90 - m) / 30, 1.1) * 2800);
  return Math.round(4660 + ((60 - m) / 60) * 4500);
}

/**
 * Interpolate a CEE score against a course's marks -> rank curve.
 * Extrapolates upward towards Rank 1 for high scores, and downward for lower scores.
 * Falls back to verified MECEE distribution model if curve is empty.
 * Never returns null for valid marks.
 */
export function estimateRank(marks: number, curve: CurvePoint[]): number {
  const points = [...curve]
    .filter((p) => Number.isFinite(p.marks) && Number.isFinite(p.estimated_rank))
    .sort((a, b) => a.marks - b.marks);

  if (points.length === 0) {
    return defaultMeceeRank(marks);
  }

  if (points.length === 1) {
    const single = points[0]!;
    if (marks === single.marks) return Math.round(single.estimated_rank);
    return defaultMeceeRank(marks);
  }

  const first = points[0]!;
  const last = points[points.length - 1]!;

  // Upward extrapolation towards rank 1 for top scores
  if (marks > last.marks) {
    const targetTopMarks = 185;
    const progress = Math.min(1, Math.max(0, (marks - last.marks) / Math.max(1, targetTopMarks - last.marks)));
    const targetTopRank = 1;
    return Math.max(1, Math.round(last.estimated_rank - progress * (last.estimated_rank - targetTopRank)));
  }

  // Downward extrapolation for lower scores
  if (marks < first.marks) {
    const progress = Math.max(0, (first.marks - marks) / Math.max(1, first.marks));
    return Math.round(first.estimated_rank + progress * (first.estimated_rank * 0.7));
  }

  // Linear interpolation within loaded points
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
