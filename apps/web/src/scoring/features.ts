import Meyda from "meyda";

const FRAME_SIZE = 2048;
const HOP_SIZE = 1024;
const MIN_PITCH_HZ = 60;
const MAX_PITCH_HZ = 800;
const NOISE_FLOOR = 0.01;

function downsample(values: number[], targetLength: number): number[] {
  if (values.length === 0) return [];
  if (values.length <= targetLength) return values;

  const result: number[] = [];
  const step = values.length / targetLength;
  for (let i = 0; i < targetLength; i++) {
    const start = Math.floor(i * step);
    const end = Math.floor((i + 1) * step);
    const slice = values.slice(start, Math.max(start + 1, end));
    result.push(slice.reduce((sum, v) => sum + v, 0) / slice.length);
  }
  return result;
}

function normalizeSequence(values: number[]): number[] {
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  if (range < 1e-6) return values.map(() => 0.5);
  return values.map((v) => (v - min) / range);
}

export function extractFeatures(
  audioBuffer: AudioBuffer,
): import("../types").AudioFeatures {
  const channel = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  const duration = audioBuffer.duration;

  const pitchFrames: number[] = [];
  const rmsFrames: number[] = [];
  const mfccSums: number[] = [];
  let mfccCount = 0;

  Meyda.bufferSize = FRAME_SIZE;
  Meyda.sampleRate = sampleRate;

  for (let i = 0; i + FRAME_SIZE <= channel.length; i += HOP_SIZE) {
    const slice = channel.slice(i, i + FRAME_SIZE);
    const rms = Meyda.extract("rms", slice) as number;
    rmsFrames.push(rms ?? 0);

    if ((rms ?? 0) < NOISE_FLOOR) {
      continue;
    }

    const pitch = (Meyda.extract as (feature: string, slice: Float32Array) => number)(
      "yin",
      slice,
    );
    if (pitch && pitch >= MIN_PITCH_HZ && pitch <= MAX_PITCH_HZ) {
      pitchFrames.push(pitch);
    }

    const mfcc = Meyda.extract("mfcc", slice) as number[] | undefined;
    if (mfcc && mfcc.length > 0) {
      if (mfccSums.length === 0) {
        mfccSums.push(...mfcc);
      } else {
        mfcc.forEach((value, idx) => {
          mfccSums[idx] += value;
        });
      }
      mfccCount++;
    }
  }

  const pitchContour = normalizeSequence(
    downsample(pitchFrames.length > 0 ? pitchFrames : [150, 140, 130], 20),
  );
  const envelope = normalizeSequence(downsample(rmsFrames, 20));
  const mfcc =
    mfccCount > 0
      ? mfccSums.map((v) => v / mfccCount)
      : new Array(13).fill(0);

  return { duration, pitchContour, envelope, mfcc };
}
