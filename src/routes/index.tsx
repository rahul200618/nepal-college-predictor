import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, GraduationCap, Github } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MarksSlider } from "@/components/cee/MarksSlider";
import { CATEGORIES, COURSES, DATA_NOTE } from "@/lib/cee-constants";

const TITLE = "Nepal CEE College Predictor — Estimate Your Rank & Chances";
const DESCRIPTION =
  "Enter your MECEE-BL marks, course and reservation category to estimate your CEE rank and see which Nepali colleges give you a high, moderate or low chance.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: Home,
});

function Step({ n, label, children }: { n: number; label: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-border px-5 py-6 first:border-t-0 sm:px-8">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-[13px] font-bold text-primary-foreground">
          {n}
        </span>
        <h2 className="text-xl font-semibold text-primary">{label}</h2>
      </div>
      {children}
    </div>
  );
}

function Home() {
  const navigate = useNavigate();
  const [course, setCourse] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [marks, setMarks] = useState(80);

  const ready = course !== "" && category !== "";

  return (
    <main className="min-h-screen bg-surface">
      <header className="bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-5 py-5 sm:px-8">
          <GraduationCap className="size-6" aria-hidden />
          <span className="text-lg font-semibold tracking-tight">Nepal CEE Predictor</span>
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

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-8">
        <h1 className="text-[28px] font-bold leading-tight text-primary sm:text-4xl">
          Find Your College. Instantly.
        </h1>
        <p className="mt-3 max-w-xl text-[15px] text-foreground">
          Based on 2024–25 MEC official admission data. Enter your MECEE-BL marks and see your
          scholarship and paying chances at every college for your program.
        </p>

        <form
          className="mt-8 overflow-hidden rounded-xl border border-primary/20 bg-card shadow-sm"
          onSubmit={(e) => {
            e.preventDefault();
            if (!ready) return;
            void navigate({
              to: "/results",
              search: { course, category, marks },
            });
          }}
        >
          <Step n={1} label="Choose your course">
            <Select value={course} onValueChange={setCourse}>
              <SelectTrigger className="w-full" aria-label="Course">
                <SelectValue placeholder="Select a program" />
              </SelectTrigger>
              <SelectContent>
                {COURSES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Step>

          <Step n={2} label="Choose your category">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full" aria-label="Reservation category">
                <SelectValue placeholder="Select a reservation category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Step>

          <Step n={3} label="Enter your CEE marks">
            <MarksSlider value={marks} onChange={setMarks} />
          </Step>

          <div className="border-t border-border bg-info-surface px-5 py-5 sm:px-8">
            <Button
              type="submit"
              size="lg"
              disabled={!ready}
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
            >
              Predict Now
              <ArrowRight className="size-4" aria-hidden />
            </Button>
            {!ready && (
              <p className="mt-2 text-center text-[13px] italic text-muted-foreground">
                Pick a course and category to continue.
              </p>
            )}
          </div>
        </form>

        {/* Stats Bar */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 rounded-lg border border-primary/10 bg-card px-5 py-4 text-[13px] text-muted-foreground shadow-sm">
          <span className="flex items-center gap-1.5">
            <span className="text-base font-bold tabular-nums text-primary">82</span>
            Colleges
          </span>
          <span className="hidden text-border sm:block">·</span>
          <span className="flex items-center gap-1.5">
            <span className="text-base font-bold tabular-nums text-primary">16</span>
            Programs
          </span>
          <span className="hidden text-border sm:block">·</span>
          <span className="flex items-center gap-1.5">
            <span className="text-base font-bold tabular-nums text-primary">14</span>
            Quota categories
          </span>
          <span className="hidden text-border sm:block">·</span>
          <span>2024–25 MEC data</span>
        </div>

        <p className="mt-4 text-[13px] italic text-muted-foreground">{DATA_NOTE}</p>
      </div>
    </main>
  );
}

