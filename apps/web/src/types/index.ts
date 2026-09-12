export type PlayerMode = "child" | "grownup";

export type AnimalId = "cow" | "dog" | "cat" | "sheep" | "duck";

export interface Animal {
  id: AnimalId;
  name: string;
  emoji: string;
  soundLabel: string;
}

export interface ScoringProfile {
  animal: AnimalId;
  duration: { min: number; max: number; ideal: number };
  pitch: { minHz: number; maxHz: number; contour: number[] };
  envelope: number[];
  mfcc: number[];
  encouragingMessages: { high: string; medium: string; low: string };
}

export interface AudioFeatures {
  duration: number;
  pitchContour: number[];
  pitchHz: { min: number; max: number };
  envelope: number[];
  mfcc: number[];
}

export interface ScoreResult {
  rawScore: number;
  finalScore: number;
  message: string;
  breakdown: {
    duration: number;
    pitch: number;
    envelope: number;
    mfcc: number;
  };
}

export interface LeaderboardEntry {
  id: string;
  nickname: string;
  animal: AnimalId;
  score: number;
  mode: PlayerMode;
  submittedAt: string;
}
