import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { getCurrentUser, subscribeToAuth, type MetroUser } from "@/lib/auth";
import {
  ArrowRight,
  GraduationCap,
  TrendingUp,
  Building2,
  Users,
  ChevronRight,
  Sparkles,
  Shield,
  BarChart3,
  BookOpen,
} from "lucide-react";

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
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserNav } from "@/components/UserNav";
import { useAuth } from "@/contexts/AuthContext";
import { QuotaBreakdownCard } from "@/components/cee/QuotaBreakdownCard";
import { Landmark, Compass, Award, CheckCircle2 } from "lucide-react";

const TITLE = "METRO RANK — Nepal CEE College Predictor 2026";
const DESCRIPTION =
  "Enter your MECEE-BL marks, course and reservation category to estimate your CEE rank and see which Nepali colleges give you a high, moderate or low chance.";

export const Route = createFileRoute("/")(
  {
    head: () => ({
      meta: [
        { title: TITLE },
        { name: "description", content: DESCRIPTION },
        { property: "og:title", content: TITLE },
        { property: "og:description", content: DESCRIPTION },
      ],
    }),
    component: Home,
  },
);

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="group rounded-2xl border border-border/60 bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-accent/30 hover:-translate-y-1">
      <div className="flex size-12 items-center justify-center rounded-xl bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-white">
        <Icon className="size-6" />
      </div>
      <h3 className="mt-4 text-lg font-bold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-3xl font-extrabold tabular-nums text-accent sm:text-4xl">
        {value}
      </div>
      <div className="mt-1 text-sm font-medium text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

function Step({
  n,
  label,
  children,
}: {
  n: number;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="px-6 py-6 first:pt-8 last:pb-0 sm:px-8">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full gradient-nepal text-[13px] font-bold text-white shadow-md">
          {n}
        </span>
        <h2 className="text-lg font-bold text-foreground">{label}</h2>
      </div>
      {children}
    </div>
  );
}

function Home() {
  const navigate = useNavigate();
  const { platformSettings } = useAuth();
  const [course, setCourse] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [marks, setMarks] = useState(80);
  const [user, setUser] = useState<MetroUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    void getCurrentUser().then((u) => {
      setUser(u);
      setAuthLoading(false);
    });
    const unsub = subscribeToAuth((u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  const ready = course !== "" && category !== "";

  const handlePredict = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready) return;
    if (!user) {
      void navigate({ to: "/login" });
      return;
    }
    void navigate({
      to: "/results",
      search: { course, category, marks },
    });
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 glass border-b border-border/40">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-3.5 py-2.5 sm:px-8 sm:py-3">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex size-9 items-center justify-center rounded-lg gradient-nepal shadow-md transition-transform group-hover:scale-105">
              <GraduationCap className="size-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-extrabold tracking-tight text-foreground leading-tight">
                METRO<span className="text-gradient"> RANK</span>
              </span>
              <span className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground leading-tight">
                Nepal CEE Predictor
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-2 sm:gap-2.5">
            <ThemeToggle />
            <UserNav />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-[0.03]" />
        <div className="absolute top-20 right-10 size-72 rounded-full bg-accent/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 size-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-6xl px-4 pt-8 pb-8 sm:px-8 sm:pt-24 sm:pb-16">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            {/* Left: Hero copy */}
            <div className="animate-slide-up">
              <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-3.5 py-1 text-[12px] sm:text-[13px] font-semibold text-accent">
                <Sparkles className="size-3.5" />
                2026 MEC Official Data
              </div>
              <h1 className="mt-4 text-3xl font-extrabold leading-tight text-foreground sm:text-5xl lg:text-[56px] lg:leading-[1.1]">
                Know Your
                <br />
                <span className="text-gradient">College Chances</span>
                <br />
                Before Results Drop
              </h1>
              <p className="mt-4 max-w-lg text-[15px] sm:text-[16px] leading-relaxed text-muted-foreground">
                METRO RANK uses real MECEE-BL cutoff data from 2024–25 admission
                cycles to estimate your rank and show your scholarship & paying
                chances at every medical college in Nepal.
              </p>

              {/* Stats row */}
              <div className="mt-6 flex items-center justify-around sm:justify-start gap-3 sm:gap-12 py-3.5 px-4 sm:px-0 sm:py-0 rounded-2xl bg-card/70 sm:bg-transparent border sm:border-0 border-border/50 shadow-xs sm:shadow-none">
                <StatItem value="82" label="Colleges" />
                <div className="w-px h-8 bg-border/60 sm:hidden" />
                <StatItem value="16" label="Programs" />
                <div className="w-px h-8 bg-border/60 sm:hidden" />
                <StatItem value="14" label="Quotas" />
              </div>
            </div>

            {/* Right: Prediction form or Maintenance */}
            <div className="animate-slide-up" style={{ animationDelay: "0.15s" }}>
              {platformSettings?.maintenanceMode ? (
                <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-xl p-8 text-center flex flex-col items-center justify-center min-h-[400px]">
                  <div className="rounded-full bg-amber-500/10 p-4 mb-4">
                    <Shield className="size-10 text-amber-500" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground mb-2">Maintenance Mode</h2>
                  <p className="text-muted-foreground text-sm max-w-[250px] mx-auto">
                    The predictor is currently in read-only mode during MEC official list releases. Please check back soon.
                  </p>
                </div>
              ) : (
                <form
                  className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-xl"
                  onSubmit={handlePredict}
                >
                <div className="gradient-nepal px-6 py-5 sm:px-8">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <BarChart3 className="size-5" />
                    Predict Your Rank
                  </h2>
                  <p className="mt-1 text-sm text-white/70">
                    Fill in your details and get instant results
                  </p>
                </div>

                <div className="divide-y divide-border/40">
                  <Step n={1} label="Choose your course">
                    <Select value={course} onValueChange={setCourse}>
                      <SelectTrigger
                        className="w-full rounded-xl"
                        aria-label="Course"
                      >
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
                      <SelectTrigger
                        className="w-full rounded-xl"
                        aria-label="Reservation category"
                      >
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
                </div>

                <div className="border-t border-border/40 bg-surface/50 px-6 py-5 sm:px-8">
                  <Button
                    type="submit"
                    size="lg"
                    disabled={!ready || authLoading}
                    className="w-full rounded-xl bg-accent text-accent-foreground font-bold text-[15px] shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {authLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Loading...
                      </span>
                    ) : (
                      <>
                        {user ? "Predict Now" : "Log in to Predict"}
                        <ArrowRight className="ml-2 size-4" aria-hidden />
                      </>
                    )}
                  </Button>
                  {!ready && !authLoading && (
                    <p className="mt-3 text-center text-[13px] text-muted-foreground">
                      Pick a course and category to continue
                    </p>
                  )}
                  {ready && !user && !authLoading && (
                    <p className="mt-3 text-center text-[13px] text-muted-foreground">
                      You need to{" "}
                      <Link to="/login" className="font-semibold text-accent hover:underline">
                        log in
                      </Link>{" "}
                      to see your prediction results
                    </p>
                  )}
                </div>
              </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-border/40 bg-surface/50">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-foreground sm:text-4xl">
              Why <span className="text-gradient">METRO RANK</span>?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Built for Nepali medical aspirants, powered by verified MEC data.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={TrendingUp}
              title="Accurate Rank Estimation"
              description="Our marks-to-rank curves are calibrated from real MEC exam data across multiple years."
            />
            <FeatureCard
              icon={Building2}
              title="82+ Medical Colleges"
              description="Full coverage of Nepali medical colleges — from IOM to private KU-affiliated institutions."
            />
            <FeatureCard
              icon={Shield}
              title="All 14 Reservation Quotas"
              description="See cutoffs tailored to your category — Open, Female, Dalit, Janajati, Madhesi and more."
            />
            <FeatureCard
              icon={BookOpen}
              title="Scholarship & Paying"
              description="Compare your chances in both scholarship and paying seats across every college."
            />
          </div>
        </div>
      </section>

      {/* Counseling Tips & Quota Guide Section */}
      <section className="border-t border-border/40 bg-background">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20 space-y-10">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-3.5 py-1 text-xs font-semibold text-accent mb-3">
              <Compass className="size-3.5" />
              Nepal CEE 2026 Counseling Insights
            </div>
            <h2 className="text-3xl font-extrabold text-foreground sm:text-4xl">
              Understand Quotas &amp; Matching Rules
            </h2>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Medical Education Commission (MEC) allocates 55% of government scholarship seats to Open competition and 45% strictly across 10 statutory reservation categories.
            </p>
          </div>

          {/* Interactive Quota Breakdown Component */}
          <QuotaBreakdownCard selectedCategory={category || "Open"} />

          {/* Practical Counseling Tips Cards */}
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-xs space-y-2.5">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-lg bg-success/10 text-success">
                  <Landmark className="size-4" />
                </div>
                <h3 className="font-bold text-foreground text-sm">Valley vs. Regional Colleges</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Colleges in Kathmandu Valley (IOM, PAHS, KMC, NMC) fill up at much higher cutoff ranks. If your rank is borderline, prioritizing reputable regional hubs like Chitwan (CMC/CMS), Pokhara (MCOMS), or Biratnagar (Nobel) significantly improves admission security.
              </p>
            </div>

            <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-xs space-y-2.5">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <Award className="size-4" />
                </div>
                <h3 className="font-bold text-foreground text-sm">Priority Matching Strategy</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Always rank your true dream colleges first on the MEC online matching portal. In MEC algorithmic matching, you will never be penalized for listing top institutes at the top of your preference list.
              </p>
            </div>

            <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-xs space-y-2.5 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <CheckCircle2 className="size-4" />
                </div>
                <h3 className="font-bold text-foreground text-sm">MEC Fee Ceiling Preparation</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                For MBBS paying seats, MEC caps maximum tuition fees at ~NPR 41.68 Lakhs (inside Kathmandu Valley) and ~NPR 45.95 Lakhs (outside valley), payable in three scheduled installments.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border/40">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
          <div className="rounded-2xl gradient-nepal px-8 py-12 text-center shadow-xl sm:px-12 sm:py-16">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              Ready to find your college?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-white/75">
              Join thousands of Nepali CEE aspirants who use METRO RANK to plan
              their medical education journey.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <a
                href="#predict"
                onClick={(e) => {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-primary shadow-lg transition-all hover:shadow-xl hover:scale-105"
              >
                Start Predicting
                <ChevronRight className="size-4" />
              </a>
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
              >
                Create Account
                <Users className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-card">
        <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
          <div className="flex flex-col items-center justify-between gap-5 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-md gradient-nepal">
                <GraduationCap className="size-4 text-white" />
              </div>
              <span className="text-sm font-bold text-foreground">
                METRO<span className="text-gradient"> RANK</span>
              </span>
            </div>
            <p className="text-[13px] text-muted-foreground text-center">
              {DATA_NOTE} · Not affiliated with MEC or NMC.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
