import type {
  AudioFeatures,
  PlayerMode,
  ScoreResult,
  ScoringProfile,
} from "../types";
import { dtwSimilarity } from "./dtw";
import { mfccShapeSimilarity } from "./mfcc";
import { applyModeMultiplier } from "./modes";

const WEIGHTS = {
  duration: 0.05,
  pitch: 0.35,
  envelope: 0.28,
  mfcc: 0.32,
};

const SIMILARITY_EXPONENT = 2.2;

const PITCH_GENEROSITY = {
  grownup: { exponent: 1.75, boost: 0.1, floor: 0.15 },
  child: { exponent: 1.35, boost: 0.22, floor: 0.3 },
} as const;

function sharpen(similarity: number): number {
  return similarity ** SIMILARITY_EXPONENT;
}

function scorePitch(
  features: AudioFeatures,
  profile: ScoringProfile,
  mode: PlayerMode,
): number {
  const raw = pitchSimilarity(features, profile, mode);
  const { exponent, boost, floor } = PITCH_GENEROSITY[mode];
  const adjusted = raw ** exponent + boost;
  return Math.min(1, Math.max(floor, adjusted));
}

function durationSimilarity(
  duration: number,
  profile: ScoringProfile,
): number {
  if (duration <= 0) return 0;

  const { min, max, ideal } = profile.duration;

  if (duration >= min && duration <= max) {
    const deviation = Math.abs(duration - ideal);
    const range = Math.max(max - min, 0.1);
    // Generous in-range scoring: edges still earn ~70%, ideal earns 100%.
    return Math.max(0.7, 1 - (deviation / range) * 0.3);
  }

  const distance = duration < min ? min - duration : duration - max;
  const tolerance = Math.max(ideal * 1.1, 0.4);
  return Math.max(0, 1 - distance / tolerance);
}

function pitchHzOverlap(
  pitchHz: { min: number; max: number },
  profile: ScoringProfile,
  mode: PlayerMode,
): number {
  const overlapMin = Math.max(pitchHz.min, profile.pitch.minHz);
  const overlapMax = Math.min(pitchHz.max, profile.pitch.maxHz);
  if (overlapMax <= overlapMin) {
    return mode === "child" ? 0.3 : 0.15;
  }

  const overlap = overlapMax - overlapMin;
  const union =
    Math.max(pitchHz.max, profile.pitch.maxHz) -
    Math.min(pitchHz.min, profile.pitch.minHz);
  if (union <= 0) return 0;

  const iou = overlap / union;
  const boost = mode === "child" ? 0.12 : 0.06;
  return Math.min(1, iou + boost);
}

function pitchSimilarity(
  features: AudioFeatures,
  profile: ScoringProfile,
  mode: PlayerMode,
): number {
  const shapeScore = dtwSimilarity(features.pitchContour, profile.pitch.contour);
  const rangeScore = pitchHzOverlap(features.pitchHz, profile, mode);
  return shapeScore * 0.55 + rangeScore * 0.45;
}

function envelopeCorrelation(
  envelope: number[],
  profile: ScoringProfile,
): number {
  return dtwSimilarity(envelope, profile.envelope);
}

function pickMessage(
  score: number,
  profile: ScoringProfile,
  mode: PlayerMode,
): string {
  const { high, medium, low } = profile.encouragingMessages;
  let message = score >= 75 ? high : score >= 55 ? medium : low;
  if (mode === "child" && score >= 70) {
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
    pitch: scorePitch(features, profile, mode),
    envelope: sharpen(envelopeCorrelation(features.envelope, profile)),
    mfcc: mfccShapeSimilarity(features.mfcc, profile.mfcc),
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
