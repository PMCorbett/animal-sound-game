import { useCallback, useState } from "react";
import type { AnimalId, LeaderboardEntry, PlayerMode } from "../types";

const STORAGE_KEY = "animal-sound-game-leaderboard";

function loadEntries(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LeaderboardEntry[]) : [];
  } catch {
    return [];
  }
}

function saveEntries(entries: LeaderboardEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function useLeaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>(loadEntries);

  const submitScore = useCallback(
    (nickname: string, animal: AnimalId, score: number, mode: PlayerMode) => {
      const entry: LeaderboardEntry = {
        id: crypto.randomUUID(),
        nickname: nickname.trim().slice(0, 20),
        animal,
        score,
        mode,
        submittedAt: new Date().toISOString(),
      };
      setEntries((prev) => {
        const next = [...prev, entry].sort((a, b) => b.score - a.score);
        saveEntries(next);
        return next;
      });
      return entry;
    },
    [],
  );

  const getFiltered = useCallback(
    (animal?: AnimalId, mode?: PlayerMode | "all") => {
      return entries
        .filter((e) => (animal ? e.animal === animal : true))
        .filter((e) => (mode && mode !== "all" ? e.mode === mode : true))
        .slice(0, 20);
    },
    [entries],
  );

  return { entries, submitScore, getFiltered };
}
