import { Link } from "react-router-dom";

export function LandingPage() {
  return (
    <div className="landing-page">
      <header className="page-header">
        <h1>Animal Sound Game</h1>
        <p>Listen, copy the sound, and see your score!</p>
      </header>

      <div className="landing-actions">
        <Link to="/play" className="btn btn-primary btn-lets-play landing-btn-play">
          Play game
        </Link>
        <Link to="/leaderboard" className="btn btn-secondary landing-btn-secondary">
          View leaderboard
        </Link>
        <Link to="/what-is-a-software-engineer" className="landing-link-tertiary">
          What is a software engineer?
        </Link>
      </div>
    </div>
  );
}
