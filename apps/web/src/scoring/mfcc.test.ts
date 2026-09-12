import { describe, expect, it } from "vitest";
import cowProfile from "@assets/profiles/cow.json";
import type { ScoringProfile } from "../types";
import { mfccShapeSimilarity } from "./mfcc";

const profile = cowProfile as ScoringProfile;

describe("mfccShapeSimilarity", () => {
  it("scores a perfect profile match highly", () => {
    expect(mfccShapeSimilarity(profile.mfcc, profile.mfcc)).toBeGreaterThan(0.85);
  });

  it("scores inverted coefficients lower than a match", () => {
    const inverted = profile.mfcc.map((value) => -value);
    const match = mfccShapeSimilarity(profile.mfcc, profile.mfcc);
    expect(mfccShapeSimilarity(inverted, profile.mfcc)).toBeLessThan(match * 0.5);
  });

  it("scores unrelated spectral shapes lower than a match", () => {
    const unrelated = [50, -30, 40, -20, 10, 5, -5, 8, -3, 6, -2, 4, -1];
    const match = mfccShapeSimilarity(profile.mfcc, profile.mfcc);
    expect(mfccShapeSimilarity(unrelated, profile.mfcc)).toBeLessThan(match * 0.55);
  });
});
