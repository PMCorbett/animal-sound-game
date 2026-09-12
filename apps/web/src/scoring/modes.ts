import type { PlayerMode } from "../types";

const CHILD_FLOOR = 42;
const GROWNUP_FLOOR = 25;
const CHILD_MULTIPLIER = 1.12;
const CHILD_BONUS = 5;
const CHILD_JITTER = 4;
const GROWNUP_JITTER = 2;

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
