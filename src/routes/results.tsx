import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { ArrowLeft, Github } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RankCard } from "@/components/cee/RankCard";
import { ResultsTable } from "@/components/cee/ResultsTable";
import { CollegeListTable } from "@/components/cee/CollegeListTable";
import { predict } from "@/lib/predict.functions";
import { CATEGORIES, COURSES, DATA_NOTE } from "@/lib/cee-constants";

interface ResultsSearch {
  course: string;
  category: string;
  marks: number;
}

const TITLE = "Your CEE Prediction — Nepal CEE College Predictor";
const DESCRIPTION =
  "Your estimated MECEE-BL rank with scholarship and paying chances at every college for your selected program and category.";

const predictionQuery = (search: ResultsSearch) =>
  queryOptions({
    queryKey: ["prediction", search.course, search.category, search.marks],
    queryFn: () => predict({ data: search }),
    staleTime: 5 * 60 * 1000,
  });

export const Route = createFileRoute("/results")({
  validateSearch: (search: Record<string, unknown>): ResultsSearch => {
    const course = String(search["course"] ?? "");
    const category = String(search["category"] ?? "");
    const marks = Number(search["marks"] ?? 0);
    return {
      course: (COURSES as readonly string[]).includes(course) ? course : COURSES[0],
      category: (CATEGORIES as readonly string[]).includes(category) ? category : CATEGORIES[0],
      marks: Number.isFinite(marks) ? Math.min(200, Math.max(0, marks)) : 0,
    };
  },
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(predictionQuery(deps)),
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: Results,
});

function Results() {
  const search = Route.useSearch();
  const { data } = useSuspenseQuery(predictionQuery(search));

  return (
    <main className="min-h-screen bg-surface">
      <header className="bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-5xl items-center px-5 py-4 sm:px-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium opacity-90 hover:opacity-100"
          >
            <ArrowLeft className="size-4" aria-hidden />
            New prediction
          </Link>
          <a
            href="https://github.com/rahul200618/nepal-college-predictor"
            target="_blank"
            rel="noreferrer"
            aria-label="View source on GitHub"
            className="ml-auto opacity-80 hover:opacity-100 transition-opacity"
          >
            <Github className="size-5" aria-hidden />
          </a>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-10 px-4 py-8 sm:px-8">
        <h1 className="sr-only">
          CEE prediction for {data.course}, {data.category} category
        </h1>

        <RankCard
          estimatedRank={data.estimated_rank}
          estimatedRankRange={data.estimated_rank_range}
          course={data.course}
          category={data.category}
          marks={data.marks}
          coverage={data.coverage}
          curveVerified={data.curve_verified}
        />

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-primary">Your chances by seat type</h2>
          <Tabs defaultValue="scholarship">
            <TabsList>
              <TabsTrigger value="scholarship">
                Scholarship ({data.scholarship_results.length})
              </TabsTrigger>
              <TabsTrigger value="paying">Paying ({data.paying_results.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="scholarship" className="mt-4">
              <ResultsTable results={data.scholarship_results} type="scholarship" />
            </TabsContent>
            <TabsContent value="paying" className="mt-4">
              <ResultsTable results={data.paying_results} type="paying" />
            </TabsContent>
          </Tabs>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-primary">All colleges for {data.course}</h2>
          <p className="text-[13px] italic text-muted-foreground">
            Full 2025/26 list. Faded rows have no historical cutoff loaded yet.
          </p>
          <CollegeListTable colleges={data.colleges} program={data.course} />
        </section>

        <p className="text-[13px] italic text-muted-foreground">{DATA_NOTE}</p>
      </div>
    </main>
  );
}

