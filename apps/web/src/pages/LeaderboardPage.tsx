import { Link } from "react-router-dom";
import { HowItWorksPanel } from "../components/HowItWorksPanel";
import { LeaderboardScoresSection } from "../components/LeaderboardScoresSection";

export function LeaderboardPage() {
  return (
    <div className="leaderboard-page">
      <div className="leaderboard-split">
        <LeaderboardScoresSection />
        <HowItWorksPanel />
      </div>

      <nav className="page-nav">
        <Link to="/">← Back home</Link>
      </nav>
    </div>
  );
}
