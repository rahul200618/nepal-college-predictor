import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  GraduationCap,
  Share2,
  Columns2,
  FolderKanban,
  HelpCircle,
} from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RankCard } from "@/components/cee/RankCard";
import { ResultsTable } from "@/components/cee/ResultsTable";
import { FilterableCollegeTable } from "@/components/cee/FilterableCollegeTable";
import { CounselingTips } from "@/components/cee/CounselingTips";
import { QuotaBreakdownCard } from "@/components/cee/QuotaBreakdownCard";
import { predict } from "@/lib/predict.functions";
import { CATEGORIES, COURSES, DATA_NOTE } from "@/lib/cee-constants";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserNav } from "@/components/UserNav";

interface ResultsSearch {
  course: string;
  category: string;
  marks: number;
}

const TITLE = "Your Prediction — METRO RANK";
const DESCRIPTION =
  "Your estimated MECEE-BL rank with scholarship and paying chances at every college for your selected program and category.";

const predictionQuery = (search: ResultsSearch) =>
  queryOptions({
    queryKey: ["prediction", search.course, search.category, search.marks],
    queryFn: () => predict({ data: search }),
    staleTime: 5 * 60 * 1000,
  });

export const Route = createFileRoute("/results")(
  {
    validateSearch: (search: Record<string, unknown>): ResultsSearch => {
      const course = String(search["course"] ?? "");
      const category = String(search["category"] ?? "");
      const marks = Number(search["marks"] ?? 0);
      return {
        course: (COURSES as readonly string[]).includes(course)
          ? course
          : COURSES[0],
        category: (CATEGORIES as readonly string[]).includes(category)
          ? category
          : CATEGORIES[0],
        marks: Number.isFinite(marks) ? Math.min(200, Math.max(0, marks)) : 0,
      };
    },
    loaderDeps: ({ search }) => search,
    loader: ({ context, deps }) =>
      context.queryClient.ensureQueryData(predictionQuery(deps)),
    head: () => ({
      meta: [
        { title: TITLE },
        { name: "description", content: DESCRIPTION },
        { property: "og:title", content: TITLE },
        { property: "og:description", content: DESCRIPTION },
      ],
    }),
    component: Results,
  },
);

function Results() {
  const search = Route.useSearch();
  const { data } = useSuspenseQuery(predictionQuery(search));

  // View mode: tabbed vs side-by-side
  const [viewMode, setViewMode] = useState<"tabbed" | "side-by-side">("tabbed");

  // Determine smart default tab: if scholarship is empty but paying has data, default to paying
  const defaultTab =
    data.scholarship_results.length === 0 && data.paying_results.length > 0
      ? "paying"
      : "scholarship";

  // Build map of college -> total seats
  const collegeSeatsMap = useMemo(() => {
    const map = new Map<string, number>();
    data.colleges.forEach((c) => {
      map.set(c.college, c.seats_total);
    });
    return map;
  }, [data.colleges]);

  // Build map of college -> lowest closing rank for cutoff bars
  const closingRanks = useMemo(() => {
    const map = new Map<string, number>();
    const allResults = [...data.scholarship_results, ...data.paying_results];
    allResults.forEach((r) => {
      const existing = map.get(r.college);
      if (existing === undefined || r.closing_rank < existing) {
        map.set(r.college, r.closing_rank);
      }
    });
    return map;
  }, [data.scholarship_results, data.paying_results]);

  return (
    <main className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 glass border-b border-border/40">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-3.5 py-2.5 sm:px-8 sm:py-3">
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="inline-flex items-center justify-center size-9 sm:w-auto sm:px-3 sm:py-1.5 rounded-xl border border-border/60 bg-card/80 text-foreground hover:bg-secondary transition-all active:scale-95"
              aria-label="New prediction"
              title="Start a new prediction"
            >
              <ArrowLeft className="size-4 shrink-0" aria-hidden />
              <span className="hidden sm:inline sm:ml-1.5 text-xs font-semibold">New</span>
            </Link>
          </div>

          <Link to="/" className="flex items-center gap-2 group">
            <div className="flex size-8 items-center justify-center rounded-lg gradient-nepal shadow-sm">
              <GraduationCap className="size-4 text-white" />
            </div>
            <span className="text-base font-extrabold tracking-tight text-foreground">
              METRO<span className="text-gradient"> RANK</span>
            </span>
          </Link>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => {
                void navigator.share?.({
                  title: `METRO RANK: ${data.course} Prediction`,
                  text: `My estimated CEE rank for ${data.course}: ${data.estimated_rank?.toLocaleString() ?? "N/A"}`,
                  url: window.location.href,
                }).catch(() => {
                  void navigator.clipboard.writeText(window.location.href);
                });
              }}
              className="inline-flex items-center justify-center size-9 sm:w-auto sm:px-3 rounded-xl border border-border/60 bg-card/80 text-foreground hover:bg-secondary transition-all active:scale-95"
              aria-label="Share results"
              title="Share or copy results link"
            >
              <Share2 className="size-4 text-muted-foreground" />
              <span className="hidden sm:inline sm:ml-1.5 text-xs font-semibold">Share</span>
            </button>
            <ThemeToggle />
            <UserNav />
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl space-y-6 sm:space-y-8 px-3.5 py-5 sm:px-8 sm:py-8 animate-slide-up">
        <h1 className="sr-only">
          CEE prediction for {data.course}, {data.category} category
        </h1>

        {/* 1. Rank Card */}
        <RankCard
          estimatedRank={data.estimated_rank}
          estimatedRankRange={data.estimated_rank_range}
          course={data.course}
          category={data.category}
          marks={data.marks}
          coverage={data.coverage}
          curveVerified={data.curve_verified}
        />

        {/* Quick Jump Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-accent/25 bg-accent/5 p-3.5 sm:px-5">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-foreground">
            <span className="size-2 rounded-full bg-success animate-pulse shrink-0" />
            <span>
              Matches: <strong className="text-accent">{data.paying_results.length} Paying</strong> &amp;{" "}
              <strong className="text-success">{data.scholarship_results.length} Scholarship</strong> colleges below
            </span>
          </div>
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
            <a
              href="#colleges"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-card px-3 py-2 text-xs font-bold text-foreground shadow-xs border border-border/60 hover:border-accent hover:text-accent transition-all active:scale-95"
            >
              <span>View Colleges</span>
              <ArrowLeft className="size-3 -rotate-90" />
            </a>
            <a
              href="#counseling-tips"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-card px-3 py-2 text-xs font-semibold text-muted-foreground shadow-xs border border-border/60 hover:text-foreground transition-all active:scale-95"
            >
              <span>Tips &amp; Quotas ↓</span>
            </a>
          </div>
        </div>

        {/* 2. Scholarship vs Paying Comparison View */}
        <section id="colleges" className="space-y-4 scroll-mt-20">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-foreground">
                Scholarship vs. Paying Comparison View
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Compare your admission chances, closing ranks, and seat counts across free scholarship seats and paid paying seats.
              </p>
            </div>

            {/* View Mode Toggle: Tabbed vs Side-by-side */}
            <div className="inline-flex items-center rounded-xl border border-border/60 bg-secondary/60 p-1 self-start sm:self-auto">
              <button
                onClick={() => setViewMode("tabbed")}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                  viewMode === "tabbed"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <FolderKanban className="size-3.5" />
                <span>Tabbed</span>
              </button>
              <button
                onClick={() => setViewMode("side-by-side")}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                  viewMode === "side-by-side"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Columns2 className="size-3.5" />
                <span>Side-by-Side</span>
              </button>
            </div>
          </div>

          {/* Tabbed View */}
          {viewMode === "tabbed" && (
            <Tabs defaultValue={defaultTab}>
              <TabsList className="bg-secondary/80 rounded-xl p-1">
                <TabsTrigger
                  value="scholarship"
                  className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm font-semibold"
                >
                  🎓 Scholarship ({data.scholarship_results.length})
                </TabsTrigger>
                <TabsTrigger
                  value="paying"
                  className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm font-semibold"
                >
                  💰 Paying ({data.paying_results.length})
                </TabsTrigger>
              </TabsList>
              <TabsContent value="scholarship" className="mt-5">
                <ResultsTable
                  results={data.scholarship_results}
                  type="scholarship"
                  estimatedRank={data.estimated_rank}
                  collegeSeatsMap={collegeSeatsMap}
                  category={data.category}
                />
              </TabsContent>
              <TabsContent value="paying" className="mt-5">
                <ResultsTable
                  results={data.paying_results}
                  type="paying"
                  estimatedRank={data.estimated_rank}
                  collegeSeatsMap={collegeSeatsMap}
                  category={data.category}
                />
              </TabsContent>
            </Tabs>
          )}

          {/* Side-by-Side View */}
          {viewMode === "side-by-side" && (
            <div className="grid gap-6 lg:grid-cols-2 animate-fade-in">
              <div className="space-y-3 rounded-2xl border border-border/50 bg-card/40 p-4">
                <div className="flex items-center justify-between pb-2 border-b border-border/40">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🎓</span>
                    <h3 className="font-bold text-foreground">Scholarship Seats</h3>
                  </div>
                  <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-bold text-accent">
                    {data.scholarship_results.length} colleges
                  </span>
                </div>
                <ResultsTable
                  results={data.scholarship_results}
                  type="scholarship"
                  estimatedRank={data.estimated_rank}
                  collegeSeatsMap={collegeSeatsMap}
                  category={data.category}
                />
              </div>

              <div className="space-y-3 rounded-2xl border border-border/50 bg-card/40 p-4">
                <div className="flex items-center justify-between pb-2 border-b border-border/40">
                  <div className="flex items-center gap-2">
                    <span className="text-base">💰</span>
                    <h3 className="font-bold text-foreground">Paying Seats</h3>
                  </div>
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                    {data.paying_results.length} colleges
                  </span>
                </div>
                <ResultsTable
                  results={data.paying_results}
                  type="paying"
                  estimatedRank={data.estimated_rank}
                  collegeSeatsMap={collegeSeatsMap}
                  category={data.category}
                />
              </div>
            </div>
          )}
        </section>

        {/* 3. Interactive College Matrix */}
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              Interactive College Matrix — {data.course}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Filter by Public/Private, University (TU, KU, PAHS, BPKIHS), and Province/District. Visual Cutoff Progress Bar shows where your score ranks relative to historical cutoffs.
            </p>
          </div>

          <FilterableCollegeTable
            colleges={data.colleges}
            program={data.course}
            estimatedRank={data.estimated_rank}
            closingRanks={closingRanks}
          />
        </section>

        {/* 4. Counseling Tips & Insights Panel (Placed at bottom so college list is immediately visible) */}
        <section id="counseling-tips" className="scroll-mt-20 pt-4 border-t border-border/40">
          <CounselingTips
            course={data.course}
            category={data.category}
            marks={data.marks}
            estimatedRank={data.estimated_rank}
            scholarshipResults={data.scholarship_results}
            payingResults={data.paying_results}
            colleges={data.colleges}
          />
        </section>

        {/* 5. Nepal MEC Quota Breakdown Card (Placed at bottom) */}
        <section id="quota-breakdown" className="scroll-mt-20">
          <QuotaBreakdownCard selectedCategory={data.category} />
        </section>

        <p className="text-[13px] text-muted-foreground text-center py-4">
          {DATA_NOTE}
        </p>
      </div>
    </main>
  );
}
