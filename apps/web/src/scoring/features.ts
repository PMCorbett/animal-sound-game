import Meyda from "meyda";
import { estimatePitchHz } from "./pitch";

const FRAME_SIZE = 2048;
const HOP_SIZE = 1024;
const MIN_PITCH_HZ = 60;
const MAX_PITCH_HZ = 800;
export const SOUND_ACTIVITY_THRESHOLD = 0.01;
const NOISE_FLOOR = SOUND_ACTIVITY_THRESHOLD;
const CONTOUR_POINTS = 20;

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

/** Length of audible content — ignores trailing silence in fixed-length recordings. */
export function activeDurationFromRms(
  rmsFrames: number[],
  sampleRate: number,
): number {
  let firstActive = -1;
  let lastActive = -1;

  for (let i = 0; i < rmsFrames.length; i++) {
    if (rmsFrames[i] >= NOISE_FLOOR) {
      if (firstActive === -1) firstActive = i;
      lastActive = i;
    }
  }

  if (firstActive === -1) return 0;

  const frameSeconds = HOP_SIZE / sampleRate;
  const windowSeconds = FRAME_SIZE / sampleRate;
  return (lastActive - firstActive) * frameSeconds + windowSeconds;
}

export interface ChannelFeatures {
  duration: number;
  pitchContour: number[];
  envelope: number[];
  mfcc: number[];
  pitchHz: { min: number; max: number };
}

export function extractFeaturesFromChannel(
  channel: Float32Array,
  sampleRate: number,
): ChannelFeatures {
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

    const pitch = estimatePitchHz(slice, sampleRate);
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

  const duration = activeDurationFromRms(rmsFrames, sampleRate);
  const pitchContour = pitchContourFromFrames(pitchFrames);
  const envelope = normalizeSequence(downsample(rmsFrames, CONTOUR_POINTS));
  const mfcc =
    mfccCount > 0
      ? mfccSums.map((v) => v / mfccCount)
      : new Array(13).fill(0);

  const pitchHz = pitchRangeFromFrames(pitchFrames);

  return {
    duration,
    pitchContour,
    envelope,
    mfcc,
    pitchHz,
  };
}

function hzToNormalizedPitch(hz: number): number {
  return Math.max(
    0,
    Math.min(1, (hz - MIN_PITCH_HZ) / (MAX_PITCH_HZ - MIN_PITCH_HZ)),
  );
}

/** Map to absolute Hz scale so low moo vs high squeak produce different contours. */
function pitchContourFromFrames(pitchFrames: number[]): number[] {
  const values =
    pitchFrames.length > 0
      ? pitchFrames.map(hzToNormalizedPitch)
      : new Array(CONTOUR_POINTS).fill(0.5);
  return downsample(values, CONTOUR_POINTS);
}

function pitchRangeFromFrames(pitchFrames: number[]): { min: number; max: number } {
  if (pitchFrames.length === 0) {
    return { min: 120, max: 400 };
  }

  const sorted = [...pitchFrames].sort((a, b) => a - b);
  const percentile = (p: number) => {
    const index = (sorted.length - 1) * p;
    const lo = Math.floor(index);
    const hi = Math.ceil(index);
    if (lo === hi) return sorted[lo];
    return sorted[lo] + (sorted[hi] - sorted[lo]) * (index - lo);
  };

  const pitchMin = percentile(0.1);
  const pitchMax = percentile(0.9);

  return {
    min: Math.max(MIN_PITCH_HZ, Math.floor(pitchMin * 0.9)),
    max: Math.min(MAX_PITCH_HZ, Math.ceil(pitchMax * 1.1)),
  };
}

function frameRms(channel: Float32Array, offset: number): number {
  let sum = 0;
  for (let j = 0; j < FRAME_SIZE; j++) {
    const sample = channel[offset + j];
    sum += sample * sample;
  }
  return Math.sqrt(sum / FRAME_SIZE);
}

function findFirstActiveSample(channel: Float32Array): number {
  for (let i = 0; i + FRAME_SIZE <= channel.length; i += HOP_SIZE) {
    if (frameRms(channel, i) >= NOISE_FLOOR) {
      return i;
    }
  }
  return 0;
}

/** Trim leading silence and cap length to match the reference sound duration. */
export function trimRecordingFromOnset(
  audioBuffer: AudioBuffer,
  maxDurationSeconds: number,
  audioContext: AudioContext,
): AudioBuffer {
  const sampleRate = audioBuffer.sampleRate;
  const referenceChannel = audioBuffer.getChannelData(0);
  const firstActive = findFirstActiveSample(referenceChannel);
  const maxSamples = Math.floor(maxDurationSeconds * sampleRate);
  const endSample = Math.min(referenceChannel.length, firstActive + maxSamples);
  const length = endSample - firstActive;

  if (length <= 0) {
    return audioBuffer;
  }

  if (firstActive === 0 && length === referenceChannel.length) {
    return audioBuffer;
  }

  const trimmed = audioContext.createBuffer(
    audioBuffer.numberOfChannels,
    length,
    sampleRate,
  );

  for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
    const channel = audioBuffer.getChannelData(ch);
    trimmed.copyToChannel(channel.subarray(firstActive, endSample), ch);
  }

  return trimmed;
}

export function extractFeatures(
  audioBuffer: AudioBuffer,
): import("../types").AudioFeatures {
  const features = extractFeaturesFromChannel(
    audioBuffer.getChannelData(0),
    audioBuffer.sampleRate,
  );
  return {
    duration: features.duration,
    pitchContour: features.pitchContour,
    pitchHz: features.pitchHz,
    envelope: features.envelope,
    mfcc: features.mfcc,
  };
}
