import type { ScoreResult } from "../types";

interface ScoreDisplayProps {
  result: ScoreResult;
}

const BREAKDOWN_ROWS: {
  key: keyof ScoreResult["breakdown"];
  label: string;
}[] = [
  { key: "duration", label: "Duration" },
  { key: "pitch", label: "Pitch" },
  { key: "envelope", label: "Energy" },
  { key: "mfcc", label: "Sound shape" },
];

export function ScoreDisplay({ result }: ScoreDisplayProps) {
  return (
    <div className="score-display">
      <div className="score-circle score-circle-pop">
        <span className="score-value">{result.finalScore}</span>
        <span className="score-label">out of 100</span>
      </div>
      <p className="score-message">{result.message}</p>
    </div>
  );
}

export function ScoreBreakdown({ result }: ScoreDisplayProps) {
  return (
    <div className="score-breakdown">
      <h3 className="score-breakdown-title">How we scored you</h3>
      <table className="score-breakdown-table">
        <tbody>
          {BREAKDOWN_ROWS.map(({ key, label }) => (
            <tr key={key}>
              <th scope="row">{label}</th>
              <td>{result.breakdown[key]}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
