import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { MARKS_MAX, MARKS_MIN, MARKS_STEP } from "@/lib/cee-constants";

export function MarksSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const clamp = (n: number) => Math.min(MARKS_MAX, Math.max(MARKS_MIN, n));
  const percentage = ((value - MARKS_MIN) / (MARKS_MAX - MARKS_MIN)) * 100;

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-4xl font-extrabold tabular-nums text-foreground">
            {value.toFixed(2)}
          </div>
          <p className="text-[13px] text-muted-foreground mt-0.5">out of 200</p>
        </div>
        <Input
          type="number"
          inputMode="decimal"
          min={MARKS_MIN}
          max={MARKS_MAX}
          step={MARKS_STEP}
          value={value}
          aria-label="CEE marks"
          onChange={(e) => {
            const next = Number(e.target.value);
            if (!Number.isNaN(next)) onChange(clamp(next));
          }}
          className="w-28 text-right tabular-nums rounded-xl h-11 font-semibold border-border/60 focus:border-accent"
        />
      </div>

      {/* Progress indicator */}
      <div className="relative">
        <div className="h-2 rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full rounded-full gradient-nepal transition-all duration-200 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      <Slider
        value={[value]}
        min={MARKS_MIN}
        max={MARKS_MAX}
        step={MARKS_STEP}
        aria-label="CEE marks slider"
        onValueChange={([next]) => onChange(clamp(next ?? 0))}
      />

      <div className="flex justify-between text-[12px] font-medium text-muted-foreground">
        <span>0</span>
        <span>50</span>
        <span>100</span>
        <span>150</span>
        <span>200</span>
      </div>
    </div>
  );
}
