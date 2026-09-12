import { describe, expect, it, vi } from "vitest";
import cowProfile from "@assets/profiles/cow.json";
import type { AudioFeatures, ScoringProfile } from "../types";
import { scoreRecording } from "./scorer";

const profile = cowProfile as ScoringProfile;

const perfectMatch: AudioFeatures = {
  duration: profile.duration.ideal,
  pitchContour: profile.pitch.contour,
  pitchHz: { min: profile.pitch.minHz, max: profile.pitch.maxHz },
  envelope: profile.envelope,
  mfcc: profile.mfcc,
};

const poorMatch: AudioFeatures = {
  duration: profile.duration.ideal * 0.4,
  pitchContour: profile.pitch.contour.map((value) => 1 - value),
  pitchHz: { min: 400, max: 700 },
  envelope: profile.envelope.map((value) => 1 - value),
  mfcc: profile.mfcc.map((value) => -value),
};

describe("durationSimilarity via scoreRecording", () => {
  it("gives strong duration credit for roughly the right length", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    const closeEnough: AudioFeatures = {
      ...perfectMatch,
      duration: profile.duration.ideal * 1.15,
    };
    const result = scoreRecording(closeEnough, profile, "grownup");

    expect(result.breakdown.duration).toBeGreaterThanOrEqual(70);

    vi.restoreAllMocks();
  });
});

describe("scoreRecording", () => {
  it("scores a close match much higher than a poor match in grown-up mode", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    const good = scoreRecording(perfectMatch, profile, "grownup");
    const bad = scoreRecording(poorMatch, profile, "grownup");

    expect(good.finalScore).toBeGreaterThanOrEqual(75);
    expect(bad.finalScore).toBeLessThanOrEqual(55);
    expect(good.finalScore - bad.finalScore).toBeGreaterThanOrEqual(20);

    vi.restoreAllMocks();
  });

  it("penalises poor sound-shape matches", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    const good = scoreRecording(perfectMatch, profile, "grownup");
    const badShape: AudioFeatures = {
      ...perfectMatch,
      mfcc: [50, -30, 40, -20, 10, 5, -5, 8, -3, 6, -2, 4, -1],
    };
    const bad = scoreRecording(badShape, profile, "grownup");

    expect(good.breakdown.mfcc).toBeGreaterThan(50);
    expect(bad.breakdown.mfcc).toBeLessThan(good.breakdown.mfcc - 15);

    vi.restoreAllMocks();
  });

  it("scores pitch more generously in kid mode than grown-up mode", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    const mediocrePitch: AudioFeatures = {
      ...perfectMatch,
      pitchContour: profile.pitch.contour.map((value) => value * 0.6 + 0.2),
      pitchHz: {
        min: profile.pitch.minHz + 40,
        max: profile.pitch.maxHz + 40,
      },
    };

    const grownup = scoreRecording(mediocrePitch, profile, "grownup");
    const child = scoreRecording(mediocrePitch, profile, "child");

    expect(grownup.breakdown.pitch).toBeGreaterThan(25);
    expect(child.breakdown.pitch).toBeGreaterThan(grownup.breakdown.pitch);

    vi.restoreAllMocks();
  });

  it("keeps child mode generous but still separates good and bad attempts", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    const good = scoreRecording(perfectMatch, profile, "child");
    const bad = scoreRecording(poorMatch, profile, "child");

    expect(good.finalScore).toBeGreaterThan(bad.finalScore);
    expect(good.finalScore - bad.finalScore).toBeGreaterThanOrEqual(12);

    vi.restoreAllMocks();
  });
});
