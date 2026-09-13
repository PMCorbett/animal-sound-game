import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { isApiConfigured } from "../api/client";
import { ANIMALS } from "../data/animals";
import { LeaderboardTable } from "../components/LeaderboardTable";
import { useLeaderboard } from "../hooks/useLeaderboard";
import type { AnimalId, PlayerMode } from "../types";

type ModeFilter = PlayerMode | "all";

export function LeaderboardPage() {
  const { getFiltered, loading, error, refresh } = useLeaderboard();
  const [animalFilter, setAnimalFilter] = useState<AnimalId | "all">("all");
  const [modeFilter, setModeFilter] = useState<ModeFilter>("all");

  const entries = useMemo(
    () =>
      getFiltered(
        animalFilter === "all" ? undefined : animalFilter,
        modeFilter,
      ),
    [getFiltered, animalFilter, modeFilter],
  );

  return (
    <div className="leaderboard-page">
      <header className="page-header">
        <h1>Leaderboard</h1>
        <p>
          {isApiConfigured()
            ? "Top scores from everyone playing — refreshes every 30 seconds"
            : "Top scores on this device (local mode — set VITE_API_URL for cloud leaderboard)"}
        </p>
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

      <nav className="page-nav">
        <Link to="/">← Back to play</Link>
      </nav>
    </div>
  );
}
