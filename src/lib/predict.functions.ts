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
  estimated_rank: number;
  estimated_rank_range: [number, number] | null;
  curve_quality: string | null;
  curve_verified: boolean;
  coverage: CoverageLevel;
  scholarship_results: ResultRow[];
  paying_results: ResultRow[];
  colleges: CollegeRow[];
}

function publicClient() {
  const url =
    process.env["SUPABASE_URL"] ||
    process.env["VITE_SUPABASE_URL"] ||
    "https://sjnaimlothctgtekvurx.supabase.co";
  const key =
    process.env["SUPABASE_PUBLISHABLE_KEY"] ||
    process.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ||
    "sb_publishable_4J6ijX_aCOEAJUqifiU4TQ_7SScqEEg";

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

    let allCurves: Array<{ course: string; marks: number; estimated_rank: number; curve_quality: string }> = [];
    let historyRows: Array<{
      id: string;
      year: number;
      seat_type: string;
      round: string;
      college: string;
      university: string | null;
      closing_rank: number;
      closing_marks: number | null;
      source_url: string | null;
    }> = [];
    let collegeRows: CollegeRow[] = [];
    let programCoverage: CoverageLevel = "Partial";

    try {
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

      if (curveRes.data && curveRes.data.length > 0) {
        allCurves = curveRes.data.map((c) => ({
          course: c.course,
          marks: Number(c.marks),
          estimated_rank: c.estimated_rank,
          curve_quality: c.curve_quality,
        }));
      }

      if (historyRes.data) {
        historyRows = historyRes.data.map((h) => ({
          id: h.id,
          year: h.year,
          seat_type: h.seat_type,
          round: h.round,
          college: h.college,
          university: h.university,
          closing_rank: h.closing_rank,
          closing_marks: h.closing_marks === null ? null : Number(h.closing_marks),
          source_url: h.source_url,
        }));
      }

      if (collegeRes.data && collegeRes.data.length > 0) {
        collegeRows = collegeRes.data as CollegeRow[];
      }

      if (programRes.data?.prediction_coverage) {
        programCoverage = programRes.data.prediction_coverage as CoverageLevel;
      }
    } catch (e) {
      console.error("[METRO RANK] Error querying Supabase:", e);
    }

    const thisCourseCurve = allCurves.filter((r) => r.course === course);

    let rank: number;
    let range: [number, number] | null = null;
    let curveQuality: string | null = null;

    if (thisCourseCurve.length > 0) {
      rank = estimateRank(marks, thisCourseCurve);
      curveQuality = thisCourseCurve[0]?.curve_quality ?? "Verified working curve";
    } else {
      // Calculate rank using MECEE merit model
      rank = estimateRank(marks, []);
      const otherCourses = [...new Set(allCurves.map((r) => r.course))];
      const ranks = otherCourses
        .map((c) => {
          const cCurve = allCurves.filter((r) => r.course === c);
          return estimateRank(marks, cCurve);
        })
        .filter((r): r is number => r !== null);

      if (ranks.length > 0) {
        const min = Math.min(...ranks);
        const max = Math.max(...ranks);
        range = [Math.min(rank, min), Math.max(rank, max)];
        curveQuality = "Proxy Range Estimate";
      } else {
        curveQuality = "MEC Historical Curve";
      }
    }

    const toRow = (r: (typeof historyRows)[number]): ResultRow => ({
      id: r.id,
      college: r.college,
      university: r.university,
      year: r.year,
      round: r.round,
      closing_rank: r.closing_rank,
      closing_marks: r.closing_marks,
      source_url: r.source_url,
      chance: getChance(rank, r.closing_rank),
    });

    const sortRows = (rows: ResultRow[]) =>
      rows.sort(
        (a, b) => compareChance(a.chance, b.chance) || a.closing_rank - b.closing_rank,
      );

    return {
      course,
      category,
      marks,
      estimated_rank: rank,
      estimated_rank_range: range,
      curve_quality: curveQuality,
      curve_verified: curveQuality === "Verified working curve",
      coverage: programCoverage,
      scholarship_results: sortRows(
        historyRows.filter((r) => r.seat_type === "Scholarship").map(toRow),
      ),
      paying_results: sortRows(
        historyRows.filter((r) => r.seat_type === "Paying").map(toRow),
      ),
      colleges: collegeRows,
    };
  });
