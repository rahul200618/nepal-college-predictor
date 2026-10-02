import { useState, useMemo } from "react";
import {
  Lightbulb,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Target,
  Clock,
  MapPin,
  Award,
  ChevronDown,
  ChevronUp,
  FileCheck,
  Coins,
} from "lucide-react";
import type { ResultRow, CollegeRow } from "@/lib/predict.functions";

interface CounselingTipsProps {
  course: string;
  category: string;
  marks: number;
  estimatedRank: number | null;
  scholarshipResults: ResultRow[];
  payingResults: ResultRow[];
  colleges: CollegeRow[];
}

interface Tip {
  icon: React.ElementType;
  title: string;
  description: string;
  type: "success" | "info" | "warning" | "danger";
}

const TYPE_STYLES = {
  success: "border-success/30 bg-success/5",
  info: "border-primary/25 bg-primary/5",
  warning: "border-warning/30 bg-warning/5",
  danger: "border-danger/30 bg-danger/5",
} as const;

const ICON_STYLES = {
  success: "bg-success/15 text-success",
  info: "bg-primary/15 text-primary",
  warning: "bg-warning/15 text-warning-strong",
  danger: "bg-danger/15 text-danger",
} as const;

function generateTips({
  course,
  category,
  marks,
  estimatedRank,
  scholarshipResults,
  payingResults,
  colleges,
}: CounselingTipsProps): Tip[] {
  const tips: Tip[] = [];

  if (estimatedRank === null) {
    tips.push({
      icon: AlertTriangle,
      title: "No rank curve available",
      description:
        "Without a marks-to-rank curve for this program, we can't generate specific counseling advice. The cutoff tables below still show historical admission data for reference.",
      type: "warning",
    });
    return tips;
  }

  const highScholarship = scholarshipResults.filter((r) => r.chance === "HIGH");
  const moderateScholarship = scholarshipResults.filter((r) => r.chance === "MODERATE");
  const highPaying = payingResults.filter((r) => r.chance === "HIGH");
  const moderatePaying = payingResults.filter((r) => r.chance === "MODERATE");

  // 1. Scholarship assessment
  if (highScholarship.length > 0) {
    const collegeNames = [...new Set(highScholarship.map((r) => r.college))].slice(0, 3);
    tips.push({
      icon: Award,
      title: `Strong scholarship chances at ${highScholarship.length} college${highScholarship.length > 1 ? "s" : ""}`,
      description: `You're in the safe zone for free government scholarship seats at ${collegeNames.join(", ")}${highScholarship.length > 3 ? ` and ${highScholarship.length - 3} more` : ""}. List these at the very top of your priority web form.`,
      type: "success",
    });
  } else if (moderateScholarship.length > 0) {
    tips.push({
      icon: Target,
      title: "Borderline scholarship chances — keep as top priority",
      description: `You have moderate chances at ${moderateScholarship.length} scholarship seat${moderateScholarship.length > 1 ? "s" : ""}. Your rank is close to the cutoff — you may get matched in round 2 or subsequent matching lists. Always put them first in your preference order.`,
      type: "warning",
    });
  } else if (scholarshipResults.length > 0) {
    tips.push({
      icon: TrendingDown,
      title: "Scholarship seats are a stretch",
      description:
        "Based on past cutoffs, scholarship seats may be difficult at your current rank. Focus on paying seats or private medical institutions where your rank provides a solid safety margin.",
      type: "danger",
    });
  }

  // 2. Paying assessment & Valley vs Outside
  if (highPaying.length > 0) {
    const ktmPaying = highPaying.filter(
      (r) =>
        r.college.includes("Kathmandu") ||
        r.college.includes("Lalitpur") ||
        r.college.includes("Bhaktapur") ||
        r.college.includes("KU") ||
        r.college.includes("KIST") ||
        r.college.includes("Nepal Medical") ||
        r.college.includes("Maharajgunj"),
    );
    if (ktmPaying.length > 0) {
      tips.push({
        icon: MapPin,
        title: "Safe zone for Kathmandu Valley colleges",
        description: `You have high chances at paying seats in ${ktmPaying.length} Kathmandu Valley medical college${ktmPaying.length > 1 ? "s" : ""}. Kathmandu Valley colleges have higher clinical patient flow but fill up first — prioritize them early in your matching list.`,
        type: "success",
      });
    }

    const outsideKtm = highPaying.filter((r) => !ktmPaying.includes(r));
    if (outsideKtm.length > 0) {
      tips.push({
        icon: CheckCircle2,
        title: `${outsideKtm.length} high-chance colleges outside Kathmandu Valley`,
        description: `Colleges in Chitwan (CMC/CMS), Pokhara (MCOMS/GMC), Biratnagar (Nobel/Birat), and Bhairahawa (UCMS) offer excellent hospital infrastructure and lower living costs.`,
        type: "info",
      });
    }
  } else if (moderatePaying.length > 0) {
    tips.push({
      icon: Clock,
      title: "Consider 2nd round matching & mop-up rounds",
      description: `Your rank puts you in the moderate zone for ${moderatePaying.length} paying seat${moderatePaying.length > 1 ? "s" : ""}. MEC conducting multiple matching rounds often sees cutoff rank drop significantly in round 2 and physical matching. Do not lose hope!`,
      type: "warning",
    });
  }

  // 3. Counseling strategy based on marks
  if (marks >= 140) {
    tips.push({
      icon: TrendingUp,
      title: "Top tier scorer — dream college strategy",
      description: `With ${marks.toFixed(0)}+ marks, you have exceptional flexibility. Choose institution quality, hospital bed count, and teacher-to-student ratio over convenience.`,
      type: "success",
    });
  } else if (marks >= 100 && marks < 140) {
    tips.push({
      icon: Lightbulb,
      title: "Optimal priority ordering rule",
      description:
        "MEC matching allocates seats sequentially. Always order your preference list: 1) Dream scholarship seats, 2) Realistic scholarship seats, 3) Top Kathmandu paying seats, 4) Outside valley paying seats. Never rank a paying seat above a scholarship seat.",
      type: "info",
    });
  } else if (marks < 100 && marks > 0) {
    tips.push({
      icon: Coins,
      title: "Budget & Fee ceiling preparation",
      description:
        "MEC caps MBBS paying fees at approx. NPR 41.68 Lakhs (inside valley) and NPR 45.95 Lakhs (outside valley), payable in installments. Ensure bank guarantee or tuition financing is ready before matching.",
      type: "warning",
    });
  }

  // 4. Category-specific advice
  if (category !== "Open") {
    tips.push({
      icon: FileCheck,
      title: `${category} quota documentation readiness`,
      description: `You are applying under the ${category} reservation quota. Quota cutoffs are significantly relaxed compared to open competition. Ensure your local government (गाउँपालिका/नगरपालिका) recommendation and authentic council certificate are ready for verification.`,
      type: "info",
    });
  }

  // 5. Total seat pool
  const totalSeats = colleges.reduce((sum, c) => sum + c.seats_total, 0);
  const publicColleges = colleges.filter((c) => c.type === "Public");
  const privateColleges = colleges.filter((c) => c.type === "Private");
  if (colleges.length > 0) {
    tips.push({
      icon: Target,
      title: `${totalSeats.toLocaleString()} total ${course} seats across Nepal`,
      description: `${publicColleges.length} public/autonomous institutes and ${privateColleges.length} private colleges offer ${course}. Public seats provide heavily subsidised fees.`,
      type: "info",
    });
  }

  return tips;
}

export function CounselingTips(props: CounselingTipsProps) {
  const tips = useMemo(() => generateTips(props), [
    props.course,
    props.category,
    props.marks,
    props.estimatedRank,
    props.scholarshipResults,
    props.payingResults,
    props.colleges,
  ]);
  const [expanded, setExpanded] = useState(true);

  if (tips.length === 0) return null;

  return (
    <section className="space-y-3.5">
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 sm:gap-2.5 group text-left min-w-0"
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent/10">
            <Lightbulb className="size-4 text-accent" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base sm:text-xl font-bold text-foreground">
              Counseling Tips &amp; Insights
            </h2>
            <span className="rounded-full bg-accent/10 border border-accent/20 px-2 py-0.5 text-[10px] sm:text-[11px] font-bold text-accent">
              {tips.length} insights
            </span>
          </div>
        </button>

        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs font-semibold text-accent hover:underline flex items-center gap-1 shrink-0"
        >
          <span>{expanded ? "Collapse" : "Expand"}</span>
          {expanded ? <ChevronUp className="size-3.5 sm:size-4" /> : <ChevronDown className="size-3.5 sm:size-4" />}
        </button>
      </div>

      {expanded && (
        <div className="grid gap-3 sm:grid-cols-2 animate-fade-in">
          {tips.map((tip, i) => {
            const Icon = tip.icon;
            return (
              <div
                key={i}
                className={`rounded-2xl border p-4 transition-all hover:shadow-sm ${TYPE_STYLES[tip.type]}`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex size-9 shrink-0 items-center justify-center rounded-xl shadow-xs ${ICON_STYLES[tip.type]}`}
                  >
                    <Icon className="size-4.5" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <h3 className="font-bold text-sm text-foreground leading-snug">
                      {tip.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {tip.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
