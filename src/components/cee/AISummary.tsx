import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function AISummary({
  course,
  category,
  marks,
  estimatedRank,
  topColleges,
}: {
  course: string;
  category: string;
  marks: number;
  estimatedRank: number | null;
  topColleges: string[];
}) {
  const [text, setText] = useState("");
  const [done, setDone] = useState(false);
  const [failed, setFailed] = useState(false);

  const key = `${course}|${category}|${marks}|${estimatedRank}`;

  useEffect(() => {
    let cancelled = false;
    setText("");
    setDone(false);
    setFailed(false);

    (async () => {
      try {
        const res = await fetch("/api/ai-summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ course, category, marks, estimatedRank, topColleges }),
        });
        if (!res.ok || !res.body) throw new Error("summary failed");
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        for (;;) {
          const { done: streamDone, value } = await reader.read();
          if (streamDone) break;
          if (cancelled) return;
          setText((prev) => prev + decoder.decode(value, { stream: true }));
        }
        if (!cancelled) setDone(true);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
    };
    // Re-run only when the prediction itself changes, not on tab switches.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (failed) return null;

  return (
    <div className="rounded-lg border border-accent/25 bg-info-surface p-4">
      <p className="flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-[0.5px] text-accent">
        <Sparkles className="size-3.5" aria-hidden />
        What this means
      </p>
      {text ? (
        <p className="mt-2 text-[15px] leading-relaxed text-foreground">
          {text}
          {!done && <span className="ml-0.5 inline-block animate-pulse">▍</span>}
        </p>
      ) : (
        <div className="mt-3 space-y-2">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-11/12" />
          <Skeleton className="h-3.5 w-2/3" />
        </div>
      )}
    </div>
  );
}
