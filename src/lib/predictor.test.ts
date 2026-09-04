import { describe, it, expect } from "vitest";
import { estimateRank, getChance } from "./predictor";

const nursingCurve = [
  { marks: 40, estimated_rank: 6400 },
  { marks: 50, estimated_rank: 4800 },
  { marks: 60, estimated_rank: 3200 },
  { marks: 70, estimated_rank: 2100 },
  { marks: 75, estimated_rank: 1560 },
  { marks: 80, estimated_rank: 1029 },
  { marks: 90, estimated_rank: 520 },
  { marks: 100, estimated_rank: 240 },
  { marks: 120, estimated_rank: 60 },
  { marks: 150, estimated_rank: 10 },
];

describe("estimateRank", () => {
  it("returns ~1029 for 80 marks in BSc Nursing", () => {
    expect(estimateRank(80, nursingCurve)).toBe(1029);
  });

  it("interpolates between curve points", () => {
    expect(estimateRank(85, nursingCurve)).toBe(775);
  });

  it("clamps below the curve floor", () => {
    expect(estimateRank(0, nursingCurve)).toBe(6400);
  });

  it("clamps above the curve ceiling", () => {
    expect(estimateRank(200, nursingCurve)).toBe(10);
  });

  it("returns null with no curve data", () => {
    expect(estimateRank(80, [])).toBeNull();
  });

  it("handles a single point curve", () => {
    expect(estimateRank(80, [{ marks: 50, estimated_rank: 500 }])).toBe(500);
  });
});

describe("getChance", () => {
  it("is HIGH at or better than the closing rank", () => {
    expect(getChance(500, 500)).toBe("HIGH");
    expect(getChance(100, 500)).toBe("HIGH");
  });

  it("is MODERATE within 20% above the closing rank", () => {
    expect(getChance(560, 500)).toBe("MODERATE");
    expect(getChance(600, 500)).toBe("MODERATE");
  });

  it("is LOW beyond 120% of the closing rank", () => {
    expect(getChance(601, 500)).toBe("LOW");
  });
});
