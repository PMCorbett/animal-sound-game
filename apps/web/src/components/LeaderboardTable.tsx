import { getAnimal } from "../data/animals";
import { modeLabel } from "../scoring/modes";
import type { LeaderboardEntry } from "../types";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
}

export function LeaderboardTable({ entries }: LeaderboardTableProps) {
  if (entries.length === 0) {
    return (
      <p className="empty-leaderboard">
        No scores yet — be the first to play!
      </p>
    );
  }

  return (
    <table className="leaderboard-table">
      <thead>
        <tr>
          <th>Rank</th>
          <th>Nickname</th>
          <th>Animal</th>
          <th>Score</th>
          <th>Mode</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((entry, index) => {
          const animal = getAnimal(entry.animal);
          return (
            <tr key={entry.id}>
              <td>{index + 1}</td>
              <td>{entry.nickname}</td>
              <td>
                {animal?.emoji} {animal?.name}
              </td>
              <td className="score-cell">{entry.score}</td>
              <td>
                <span className={`mode-badge mode-${entry.mode}`}>
                  {modeLabel(entry.mode)}
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
