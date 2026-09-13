export type PlayerMode = "child" | "grownup";

export type AnimalId = "cow" | "dog" | "cat" | "sheep" | "duck";

export const ANIMAL_IDS: readonly AnimalId[] = [
  "cow",
  "dog",
  "cat",
  "sheep",
  "duck",
];

export interface ScoreRecord {
  pk: string;
  sk: string;
  nickname: string;
  score: number;
  animal: AnimalId;
  mode: PlayerMode;
  submittedAt: string;
  ttl: number;
}

export interface SubmitScoreBody {
  nickname: string;
  animal: AnimalId;
  score: number;
  mode: PlayerMode;
}

export interface LeaderboardEntry {
  id: string;
  nickname: string;
  animal: AnimalId;
  score: number;
  mode: PlayerMode;
  submittedAt: string;
}
