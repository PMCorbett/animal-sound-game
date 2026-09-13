import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { isApiConfigured } from "../api/client";
import { isWsConfigured } from "../api/ws";
import { ANIMALS } from "../data/animals";
import { HowItWorksPanel } from "../components/HowItWorksPanel";
import { LeaderboardTable } from "../components/LeaderboardTable";
import { ScoreToastStack } from "../components/ScoreToastStack";
import { useLeaderboard } from "../hooks/useLeaderboard";
import { useScoreToasts } from "../hooks/useScoreToasts";
import type { AnimalId, LeaderboardEntry, PlayerMode } from "../types";

type ModeFilter = PlayerMode | "all";

export function LeaderboardPage() {
  const [animalFilter, setAnimalFilter] = useState<AnimalId | "all">("all");
  const [modeFilter, setModeFilter] = useState<ModeFilter>("all");
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

  return (
    <div className="leaderboard-page">
      <ScoreToastStack toasts={toasts} onDismiss={dismissToast} />

      <header className="page-header">
        <h1>Leaderboard</h1>
        <p>{subtitle}</p>
        {isApiConfigured() && (
          <button type="button" className="btn btn-ghost" onClick={() => void refresh()}>
            {loading ? "Refreshing…" : "Refresh now"}
          </button>
        )}
        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}
      </header>

      <div className="leaderboard-split">
        <section className="leaderboard-panel" aria-label="Scores">
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

        <HowItWorksPanel />
      </div>

      <nav className="page-nav">
        <Link to="/">← Back to play</Link>
      </nav>
    </div>
  );
}
