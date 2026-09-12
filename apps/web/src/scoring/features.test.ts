import { describe, expect, it } from "vitest";
import { activeDurationFromRms, extractFeaturesFromChannel } from "./features";

describe("activeDurationFromRms", () => {
  it("ignores leading and trailing silence", () => {
    const sampleRate = 44100;
    const frameCount = 50;
    const rmsFrames = new Array(frameCount).fill(0.001);
    rmsFrames[10] = 0.05;
    rmsFrames[11] = 0.08;
    rmsFrames[12] = 0.06;
    rmsFrames[13] = 0.04;

    const duration = activeDurationFromRms(rmsFrames, sampleRate);
    expect(duration).toBeGreaterThan(0.1);
    expect(duration).toBeLessThan(0.5);
  });
});

describe("extractFeaturesFromChannel", () => {
  it("uses active sound length instead of full buffer length", () => {
    const sampleRate = 44100;
    const totalSeconds = 5;
    const activeSeconds = 1.2;
    const samples = new Float32Array(sampleRate * totalSeconds);

    const start = Math.floor(sampleRate * 1);
    const end = start + Math.floor(sampleRate * activeSeconds);
    for (let i = start; i < end; i++) {
      samples[i] = Math.sin((2 * Math.PI * 180 * i) / sampleRate) * 0.4;
    }

    const features = extractFeaturesFromChannel(samples, sampleRate);
    expect(features.duration).toBeGreaterThan(0.8);
    expect(features.duration).toBeLessThan(2);
    expect(features.duration).toBeLessThan(totalSeconds * 0.5);
  });
});
