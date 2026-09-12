import type {
  AudioFeatures,
  PlayerMode,
  ScoreResult,
  ScoringProfile,
} from "../types";
import { dtwSimilarity } from "./dtw";
import { applyModeMultiplier } from "./modes";

const WEIGHTS = {
  duration: 0.15,
  pitch: 0.25,
  envelope: 0.25,
  mfcc: 0.35,
};

function durationSimilarity(
  duration: number,
  profile: ScoringProfile,
): number {
  const { min, max, ideal } = profile.duration;
  if (duration < min || duration > max) {
    const distance = duration < min ? min - duration : duration - max;
    return Math.max(0, 1 - distance / ideal);
  }
  const deviation = Math.abs(duration - ideal);
  return Math.max(0, 1 - deviation / (max - min));
}

function pitchRangeOverlap(
  pitchContour: number[],
  profile: ScoringProfile,
): number {
  const dtwScore = dtwSimilarity(pitchContour, profile.pitch.contour);
  const hzValues = pitchContour.map(
    (n) =>
      profile.pitch.minHz + n * (profile.pitch.maxHz - profile.pitch.minHz),
  );
  const avgHz =
    hzValues.reduce((sum, v) => sum + v, 0) / Math.max(hzValues.length, 1);
  const inRange =
    avgHz >= profile.pitch.minHz && avgHz <= profile.pitch.maxHz ? 1 : 0.6;
  return dtwScore * 0.7 + inRange * 0.3;
}

function envelopeCorrelation(
  envelope: number[],
  profile: ScoringProfile,
): number {
  return dtwSimilarity(envelope, profile.envelope);
}

function mfccCosineSimilarity(mfcc: number[], profileMfcc: number[]): number {
  if (mfcc.length === 0 || profileMfcc.length === 0) return 0.5;

  let dot = 0;
  let magA = 0;
  let magB = 0;
  const len = Math.min(mfcc.length, profileMfcc.length);

  for (let i = 0; i < len; i++) {
    dot += mfcc[i] * profileMfcc[i];
    magA += mfcc[i] ** 2;
    magB += profileMfcc[i] ** 2;
  }

  if (magA === 0 || magB === 0) return 0.5;
  const cosine = dot / (Math.sqrt(magA) * Math.sqrt(magB));
  return (cosine + 1) / 2;
}

function pickMessage(
  score: number,
  profile: ScoringProfile,
  mode: PlayerMode,
): string {
  const { high, medium, low } = profile.encouragingMessages;
  let message = score >= 75 ? high : score >= 55 ? medium : low;
  if (mode === "child" && score >= 60) {
    message = high;
  }
  return message;
}

export function scoreRecording(
  features: AudioFeatures,
  profile: ScoringProfile,
  mode: PlayerMode,
): ScoreResult {
  const breakdown = {
    duration: durationSimilarity(features.duration, profile),
    pitch: pitchRangeOverlap(features.pitchContour, profile),
    envelope: envelopeCorrelation(features.envelope, profile),
    mfcc: mfccCosineSimilarity(features.mfcc, profile.mfcc),
  };

  const rawScore =
    (breakdown.duration * WEIGHTS.duration +
      breakdown.pitch * WEIGHTS.pitch +
      breakdown.envelope * WEIGHTS.envelope +
      breakdown.mfcc * WEIGHTS.mfcc) *
    100;

  const finalScore = applyModeMultiplier(rawScore, mode);

  return {
    rawScore: Math.round(rawScore),
    finalScore,
    message: pickMessage(finalScore, profile, mode),
    breakdown: {
      duration: Math.round(breakdown.duration * 100),
      pitch: Math.round(breakdown.pitch * 100),
      envelope: Math.round(breakdown.envelope * 100),
      mfcc: Math.round(breakdown.mfcc * 100),
    },
  };
}
