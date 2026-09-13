import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchLeaderboard,
  isApiConfigured,
  submitScoreToApi,
} from "../api/client";
import { connectLeaderboard, isWsConfigured } from "../api/ws";
import type { AnimalId, LeaderboardEntry, PlayerMode } from "../types";

const STORAGE_KEY = "animal-sound-game-leaderboard";
const REFRESH_INTERVAL_MS = 60_000;

function loadLocalEntries(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LeaderboardEntry[]) : [];
  } catch {
    return [];
  }
}

function saveLocalEntries(entries: LeaderboardEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export interface UseLeaderboardOptions {
  onRemoteScore?: (entry: LeaderboardEntry) => void;
}

export function useLeaderboard(options: UseLeaderboardOptions = {}) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>(() =>
    isApiConfigured() ? [] : loadLocalEntries(),
  );
  const [loading, setLoading] = useState(isApiConfigured());
  const [error, setError] = useState<string | null>(null);
  const entriesRef = useRef(entries);
  const onRemoteScoreRef = useRef(options.onRemoteScore);

  entriesRef.current = entries;
  onRemoteScoreRef.current = options.onRemoteScore;

  const refresh = useCallback(async () => {
    if (!isApiConfigured()) {
      setEntries(loadLocalEntries());
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await fetchLeaderboard({ limit: 100 });
      setEntries(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load leaderboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    if (!isApiConfigured()) return;

    const timer = window.setInterval(() => {
      void refresh();
    }, REFRESH_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [refresh]);

  useEffect(() => {
    if (!isApiConfigured() || !isWsConfigured()) return;

    const disconnect = connectLeaderboard({
      onEvent: (event) => {
        if (event.type !== "score_submitted") return;

        if (entriesRef.current.some((entry) => entry.id === event.entry.id)) {
          return;
        }

        setEntries((prev) =>
          [...prev, event.entry].sort((a, b) => b.score - a.score),
        );
        onRemoteScoreRef.current?.(event.entry);
      },
      onReconnect: () => {
        void refresh();
      },
    });

    return disconnect;
  }, [refresh]);

  const submitScore = useCallback(
    async (
      nickname: string,
      animal: AnimalId,
      score: number,
      mode: PlayerMode,
    ): Promise<LeaderboardEntry> => {
      const trimmed = nickname.trim().slice(0, 20);

      if (isApiConfigured()) {
        const entry = await submitScoreToApi(trimmed, animal, score, mode);
        setEntries((prev) =>
          [...prev, entry].sort((a, b) => b.score - a.score),
        );
        return entry;
      }

      const entry: LeaderboardEntry = {
        id: crypto.randomUUID(),
        nickname: trimmed,
        animal,
        score,
        mode,
        submittedAt: new Date().toISOString(),
      };
      setEntries((prev) => {
        const next = [...prev, entry].sort((a, b) => b.score - a.score);
        saveLocalEntries(next);
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

  return { entries, submitScore, getFiltered, loading, error, refresh };
}
