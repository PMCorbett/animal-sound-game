import { describe, expect, it } from "vitest";
import { dtwDistance, dtwSimilarity } from "./dtw";

describe("dtw", () => {
  it("returns 0 distance for identical sequences", () => {
    const seq = [0.1, 0.5, 0.9, 0.3];
    expect(dtwDistance(seq, seq)).toBe(0);
    expect(dtwSimilarity(seq, seq)).toBe(1);
  });

  it("returns higher distance for different sequences", () => {
    const a = [0, 0.5, 1];
    const b = [1, 0.5, 0];
    expect(dtwDistance(a, b)).toBeGreaterThan(0);
    expect(dtwSimilarity(a, b)).toBeLessThan(1);
  });

  it("handles empty sequences", () => {
    expect(dtwDistance([], [1, 2])).toBe(1);
    expect(dtwSimilarity([], [1, 2])).toBeLessThan(0.05);
  });
});
