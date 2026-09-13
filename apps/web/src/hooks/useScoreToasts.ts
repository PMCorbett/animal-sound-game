import { useCallback, useState } from "react";
import type { LeaderboardEntry } from "../types";

export interface ScoreToast {
  id: string;
  entry: LeaderboardEntry;
}

const MAX_TOASTS = 3;
const TOAST_DURATION_MS = 5000;

export function useScoreToasts() {
  const [toasts, setToasts] = useState<ScoreToast[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback(
    (entry: LeaderboardEntry) => {
      const id = crypto.randomUUID();
      setToasts((prev) => {
        const next = [...prev, { id, entry }];
        return next.length > MAX_TOASTS ? next.slice(-MAX_TOASTS) : next;
      });
      window.setTimeout(() => dismissToast(id), TOAST_DURATION_MS);
    },
    [dismissToast],
  );

  return { toasts, pushToast, dismissToast };
}
