import type { PlayerMode } from "../types";

const CHILD_FLOOR = 50;
const GROWNUP_FLOOR = 35;
const CHILD_MULTIPLIER = 1.25;
const CHILD_BONUS = 10;
const CHILD_JITTER = 8;
const GROWNUP_JITTER = 5;

export function applyModeMultiplier(rawScore: number, mode: PlayerMode): number {
  const jitterRange = mode === "child" ? CHILD_JITTER : GROWNUP_JITTER;
  const jitter = (Math.random() - 0.5) * 2 * jitterRange;

  let score =
    mode === "child"
      ? Math.min(100, rawScore * CHILD_MULTIPLIER + CHILD_BONUS)
      : rawScore;

  score = Math.round(score + jitter);
  const floor = mode === "child" ? CHILD_FLOOR : GROWNUP_FLOOR;
  return Math.min(100, Math.max(floor, score));
}

export function modeLabel(mode: PlayerMode): string {
  return mode === "child" ? "Kid" : "Grown-up";
}
