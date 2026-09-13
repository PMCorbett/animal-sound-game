import { describe, expect, it } from "vitest";
import { extractWaveformPeaks } from "./waveform";

function makeBuffer(samples: number[], sampleRate = 44100): AudioBuffer {
  const buffer = {
    length: samples.length,
    duration: samples.length / sampleRate,
    sampleRate,
    numberOfChannels: 1,
    getChannelData: () => new Float32Array(samples),
    copyFromChannel: () => {},
    copyToChannel: () => {},
  };
  return buffer as AudioBuffer;
}

describe("extractWaveformPeaks", () => {
  it("returns empty array for silent buffer", () => {
    expect(extractWaveformPeaks(makeBuffer([]))).toEqual([]);
  });

  it("normalizes peaks to 0–1", () => {
    const peaks = extractWaveformPeaks(makeBuffer([0, 0.5, 1, 0.25]), 4);
    expect(peaks).toHaveLength(4);
    expect(Math.max(...peaks)).toBe(1);
    expect(Math.min(...peaks)).toBeGreaterThanOrEqual(0);
  });
});
