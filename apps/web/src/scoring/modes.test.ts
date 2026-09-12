import { describe, expect, it, vi } from "vitest";
import { applyModeMultiplier, modeLabel } from "./modes";

describe("applyModeMultiplier", () => {
  it("boosts child scores with multiplier and bonus", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const score = applyModeMultiplier(60, "child");
    expect(score).toBeGreaterThanOrEqual(50);
    expect(score).toBeLessThanOrEqual(100);
    vi.restoreAllMocks();
  });

  it("applies grown-up floor", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const score = applyModeMultiplier(10, "grownup");
    expect(score).toBeGreaterThanOrEqual(25);
    vi.restoreAllMocks();
  });
});

describe("modeLabel", () => {
  it("returns readable labels", () => {
    expect(modeLabel("child")).toBe("Kid");
    expect(modeLabel("grownup")).toBe("Grown-up");
  });
});
