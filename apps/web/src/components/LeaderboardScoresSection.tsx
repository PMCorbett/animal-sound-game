import { useCallback, useMemo, useState } from "react";
import { isApiConfigured } from "../api/client";
import { isWsConfigured } from "../api/ws";
import { ANIMALS } from "../data/animals";
import { LeaderboardTable } from "./LeaderboardTable";
import { ScoreToastStack } from "./ScoreToastStack";
import { useLeaderboard } from "../hooks/useLeaderboard";
import { useScoreToasts } from "../hooks/useScoreToasts";
import type { AnimalId, LeaderboardEntry, PlayerMode } from "../types";

type ModeFilter = PlayerMode | "all";

export interface LeaderboardScoresSectionProps {
  embedded?: boolean;
  defaultModeFilter?: ModeFilter;
  className?: string;
}

export function LeaderboardScoresSection({
  embedded = false,
  defaultModeFilter = "all",
  className = "",
}: LeaderboardScoresSectionProps) {
  const [animalFilter, setAnimalFilter] = useState<AnimalId | "all">("all");
  const [modeFilter, setModeFilter] = useState<ModeFilter>(defaultModeFilter);
  const { toasts, pushToast, dismissToast } = useScoreToasts();

  const matchesFilters = useCallback(
    (entry: LeaderboardEntry) => {
      if (animalFilter !== "all" && entry.animal !== animalFilter) return false;
      if (modeFilter !== "all" && entry.mode !== modeFilter) return false;
      return true;
    },
    [animalFilter, modeFilter],
  );

  const onRemoteScore = useCallback(
    (entry: LeaderboardEntry) => {
      if (matchesFilters(entry)) {
        pushToast(entry);
      }
    },
    [matchesFilters, pushToast],
  );

  const { getFiltered, loading, error, refresh } = useLeaderboard({
    onRemoteScore,
  });

  const entries = useMemo(
    () =>
      getFiltered(
        animalFilter === "all" ? undefined : animalFilter,
        modeFilter,
      ),
    [getFiltered, animalFilter, modeFilter],
  );

  const subtitle = isApiConfigured()
    ? isWsConfigured()
      ? "Top scores from everyone playing — updates live"
      : "Top scores from everyone playing — set VITE_WS_URL for live updates"
    : "Top scores on this device (local mode — set VITE_API_URL for cloud leaderboard)";

  const TitleTag = embedded ? "h2" : "h1";

  return (
    <section
      className={`leaderboard-panel ${className}`.trim()}
      aria-label="Scores"
    >
      <ScoreToastStack toasts={toasts} onDismiss={dismissToast} />

      <header
        className={
          embedded ? "se-leaderboard-header" : "leaderboard-scores-page-header"
        }
      >
        <TitleTag>Leaderboard</TitleTag>
        <p>{subtitle}</p>
        {isApiConfigured() && (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => void refresh()}
          >
            {loading ? "Refreshing…" : "Refresh now"}
          </button>
        )}
        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}
      </header>

      <div className="filter-tabs">
        <div className="filter-group">
          <span className="filter-label">Mode:</span>
          {(["all", "child", "grownup"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              className={`filter-tab ${modeFilter === mode ? "active" : ""}`}
              onClick={() => setModeFilter(mode)}
            >
              {mode === "all" ? "Everyone" : mode === "child" ? "Kids" : "Grown-ups"}
            </button>
          ))}
        </div>
        <div className="filter-group">
          <span className="filter-label">Animal:</span>
          <button
            type="button"
            className={`filter-tab ${animalFilter === "all" ? "active" : ""}`}
            onClick={() => setAnimalFilter("all")}
          >
            All
          </button>
          {ANIMALS.map((animal) => (
            <button
              key={animal.id}
              type="button"
              className={`filter-tab ${animalFilter === animal.id ? "active" : ""}`}
              onClick={() => setAnimalFilter(animal.id)}
            >
              {animal.emoji}
            </button>
          ))}
        </div>
      </div>

      <LeaderboardTable entries={entries} />
    </section>
  );
}
