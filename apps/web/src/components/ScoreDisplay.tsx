import type { ScoreResult } from "../types";

interface ScoreDisplayProps {
  result: ScoreResult;
  practiceMode: boolean;
}

export function ScoreDisplay({ result, practiceMode }: ScoreDisplayProps) {
  return (
    <div className="score-display">
      <div className="score-circle score-circle-pop">
        <span className="score-value">{result.finalScore}</span>
        <span className="score-label">out of 100</span>
      </div>
      <p className="score-message">{result.message}</p>
      {practiceMode && (
        <p className="practice-badge">Practice round — not saved</p>
      )}
      <details className="score-breakdown">
        <summary>How we scored you</summary>
        <ul>
          <li>Duration: {result.breakdown.duration}%</li>
          <li>Pitch: {result.breakdown.pitch}%</li>
          <li>Energy: {result.breakdown.envelope}%</li>
          <li>Sound shape: {result.breakdown.mfcc}%</li>
        </ul>
      </details>
    </div>
  );
}
