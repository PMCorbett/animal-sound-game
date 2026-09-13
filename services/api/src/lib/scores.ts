import type { AnimalId, PlayerMode, ScoreRecord } from "../types.js";

const TTL_DAYS = 7;
const RATE_LIMIT_PER_HOUR = 3;

export function animalPartitionKey(animal: AnimalId): string {
  return `ANIMAL#${animal}`;
}

export function globalPartitionKey(): string {
  return "GLOBAL";
}

export function ratePartitionKey(animal: AnimalId, nickname: string): string {
  return `RATE#${animal}#${nickname.toLowerCase()}`;
}

export function scoreSortKey(score: number, submittedAt: string): string {
  const padded = String(score).padStart(8, "0");
  return `SCORE#${padded}#${submittedAt}`;
}

export function rateSortKey(hourBucket: string): string {
  return `HOUR#${hourBucket}`;
}

export function hourBucket(date: Date): string {
  return date.toISOString().slice(0, 13);
}

export function ttlEpoch(date: Date): number {
  return Math.floor(date.getTime() / 1000) + TTL_DAYS * 24 * 60 * 60;
}

export function buildScoreRecord(
  body: {
    nickname: string;
    animal: AnimalId;
    score: number;
    mode: PlayerMode;
  },
  submittedAt: Date,
): ScoreRecord {
  const iso = submittedAt.toISOString();
  const sk = scoreSortKey(body.score, iso);

  return {
    pk: animalPartitionKey(body.animal),
    sk,
    nickname: body.nickname,
    score: body.score,
    animal: body.animal,
    mode: body.mode,
    submittedAt: iso,
    ttl: ttlEpoch(submittedAt),
  };
}

export function recordToEntry(record: ScoreRecord): {
  id: string;
  nickname: string;
  animal: AnimalId;
  score: number;
  mode: PlayerMode;
  submittedAt: string;
} {
  return {
    id: record.sk,
    nickname: record.nickname,
    animal: record.animal,
    score: record.score,
    mode: record.mode,
    submittedAt: record.submittedAt,
  };
}

export function matchesModeFilter(
  record: ScoreRecord,
  mode?: PlayerMode,
): boolean {
  return !mode || record.mode === mode;
}

export { RATE_LIMIT_PER_HOUR };
