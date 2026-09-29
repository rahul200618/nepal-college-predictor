import { useState } from "react";
import { Users, Info, ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { MEC_QUOTAS } from "@/lib/nepal-colleges-meta";

export function QuotaBreakdownCard({ selectedCategory }: { selectedCategory: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2.5 text-left group w-full justify-between"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-accent/10">
              <Users className="size-4 text-accent" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <span>Nepal MEC Quota & Reservation Breakdown</span>
                <span className="hidden sm:inline-block text-[11px] font-normal text-muted-foreground">
                  (चिकित्सा शिक्षा आयोग आरक्षण सिट विवरण)
                </span>
              </h3>
              <p className="text-xs text-muted-foreground">
                Current selection: <strong className="text-accent">{selectedCategory}</strong> · 55% Open, 45% Reserved Quota
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-accent font-semibold shrink-0">
            <span>{isOpen ? "Hide details" : "View breakdown"}</span>
            {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </div>
        </button>
      </div>

      {/* Quota badges summary (always visible) */}
      <div className="flex items-center gap-1.5 flex-wrap pt-1">
        {MEC_QUOTAS.map((q) => {
          const isCurrent = q.key === selectedCategory;
          return (
            <span
              key={q.key}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all",
                isCurrent
                  ? "border-accent bg-accent text-white shadow-sm ring-2 ring-accent/30"
                  : cn(q.badgeClass, "border"),
              )}
            >
              {isCurrent && <CheckCircle2 className="size-3" />}
              <span>{q.label}</span>
              <span className="opacity-75 text-[10px]">({q.share})</span>
            </span>
          );
        })}
      </div>

      {/* Detailed collapsible explanation */}
      {isOpen && (
        <div className="pt-3 border-t border-border/40 space-y-3 animate-fade-in text-xs">
          <div className="rounded-xl bg-secondary/60 p-3 flex items-start gap-2.5 text-muted-foreground">
            <Info className="size-4 text-accent shrink-0 mt-0.5" />
            <p>
              According to the <strong>Medical Education Commission (MEC) Act</strong>, all government scholarship seats in Nepal are divided: <strong>55% Open Competition</strong> and <strong>45% Reserved Quota</strong>. The 45% quota is distributed among the groups below. You must submit valid government-issued quota certificates during counseling.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {MEC_QUOTAS.map((q) => {
              const isCurrent = q.key === selectedCategory;
              return (
                <div
                  key={q.key}
                  className={cn(
                    "rounded-xl border p-3 transition-all",
                    isCurrent
                      ? "border-accent bg-accent/5 ring-1 ring-accent"
                      : "border-border/50 bg-surface/40",
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-foreground text-xs">
                      {q.label}{" "}
                      <span className="text-[11px] font-normal text-muted-foreground">
                        ({q.labelNp})
                      </span>
                    </span>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-foreground">
                      {q.share}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {q.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
