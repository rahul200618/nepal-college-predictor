import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import {
  estimateRank,
  getChance,
  compareChance,
  type ChanceLevel,
  type CoverageLevel,
} from "./predictor";

export interface ResultRow {
  id: string;
  college: string;
  university: string | null;
  year: number;
  round: string;
  closing_rank: number;
  closing_marks: number | null;
  source_url: string | null;
  chance: ChanceLevel;
}

export interface CollegeRow {
  id: string;
  college: string;
  type: string;
  district: string | null;
  seats_total: number;
  historical_cutoff_loaded: boolean;
}

export interface PredictionResult {
  course: string;
  category: string;
  marks: number;
  estimated_rank: number | null;
  estimated_rank_range: [number, number] | null;
  curve_quality: string | null;
  curve_verified: boolean;
  coverage: CoverageLevel;
  scholarship_results: ResultRow[];
  paying_results: ResultRow[];
  colleges: CollegeRow[];
}

function publicClient() {
  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export const predict = createServerFn({ method: "GET" })
  .inputValidator((input: { course: string; category: string; marks: number }) => ({
    course: String(input.course),
    category: String(input.category),
    marks: Math.min(200, Math.max(0, Number(input.marks) || 0)),
  }))
  .handler(async ({ data }): Promise<PredictionResult> => {
    const supabase = publicClient();
    const { course, category, marks } = data;

    const [curveRes, historyRes, collegeRes, programRes] = await Promise.all([
      supabase
        .from("marks_rank_curves")
        .select("course, marks, estimated_rank, curve_quality")
        .order("marks", { ascending: true }),
      supabase
        .from("historical_data")
        .select(
          "id, year, seat_type, round, college, university, closing_rank, closing_marks, source_url",
        )
        .eq("course", course)
        .eq("category", category),
      supabase
        .from("college_seats")
        .select("id, college, type, district, seats_total, historical_cutoff_loaded")
        .eq("program", course)
        .order("college", { ascending: true }),
      supabase
        .from("programs")
        .select("prediction_coverage")
        .eq("name", course)
        .maybeSingle(),
    ]);

    const allCurves = curveRes.data ?? [];
    const thisCourseCurve = allCurves
      .filter((r) => r.course === course)
      .map((r) => ({
        marks: Number(r.marks),
        estimated_rank: r.estimated_rank,
      }));

    let rank: number | null = null;
    let range: [number, number] | null = null;
    let curveQuality: string | null = null;

    if (thisCourseCurve.length > 0) {
      rank = estimateRank(marks, thisCourseCurve);
      curveQuality = allCurves.find((r) => r.course === course)?.curve_quality ?? null;
    } else {
      const otherCourses = [...new Set(allCurves.map((r) => r.course))];
      const ranks = otherCourses
        .map((c) => {
          const cCurve = allCurves
            .filter((r) => r.course === c)
            .map((r) => ({
              marks: Number(r.marks),
              estimated_rank: r.estimated_rank,
            }));
          return estimateRank(marks, cCurve);
        })
        .filter((r): r is number => r !== null);

      if (ranks.length > 0) {
        const min = Math.min(...ranks);
        const max = Math.max(...ranks);
        range = [min, max];
        rank = Math.round((min + max) / 2);
        curveQuality = "Proxy Range Estimate";
      }
    }

    const toRow = (r: NonNullable<typeof historyRes.data>[number]): ResultRow => ({
      id: r.id,
      college: r.college,
      university: r.university,
      year: r.year,
      round: r.round,
      closing_rank: r.closing_rank,
      closing_marks: r.closing_marks === null ? null : Number(r.closing_marks),
      source_url: r.source_url,
      chance: rank === null ? "LOW" : getChance(rank, r.closing_rank),
    });

    const sortRows = (rows: ResultRow[]) =>
      rows.sort(
        (a, b) => compareChance(a.chance, b.chance) || a.closing_rank - b.closing_rank,
      );

    const rows = historyRes.data ?? [];

    return {
      course,
      category,
      marks,
      estimated_rank: rank,
      estimated_rank_range: range,
      curve_quality: curveQuality,
      curve_verified: curveQuality === "Verified working curve",
      coverage: ((programRes.data?.prediction_coverage as CoverageLevel) ?? "None"),
      scholarship_results: sortRows(rows.filter((r) => r.seat_type === "Scholarship").map(toRow)),
      paying_results: sortRows(rows.filter((r) => r.seat_type === "Paying").map(toRow)),
      colleges: (collegeRes.data ?? []) as CollegeRow[],
    };
  });
