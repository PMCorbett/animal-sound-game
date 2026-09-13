import { useState } from "react";

const STEPS = [
  {
    icon: "🎤",
    title: "You make a sound",
    body:
      "When you press record, your device listens through the microphone — just like a voice memo!",
  },
  {
    icon: "🎮",
    title: "The game listens",
    body:
      "The game compares your sound to what the animal should sound like and gives you a score out of 100.",
  },
  {
    icon: "☁️",
    title: "Your score goes to the cloud",
    body:
      "If you save your score, it travels over the internet to a computer in Amazon's cloud (AWS). That's a data centre full of servers — like a giant filing cabinet for the internet.",
  },
  {
    icon: "🏆",
    title: "Everyone sees the leaderboard",
    body:
      "The leaderboard shows the best scores from everyone playing today. Your nickname is all we save — no photos, no real names.",
  },
] as const;

const TECH_STACK = [
  { label: "React", detail: "The game screen in your browser" },
  { label: "S3 + CloudFront", detail: "Hosts the website and animal sounds" },
  { label: "API Gateway + Lambda", detail: "Saves scores when you submit" },
  { label: "DynamoDB", detail: "Stores leaderboard entries (auto-deleted after 7 days)" },
  { label: "GitHub Actions", detail: "Tests and deploys new versions automatically" },
] as const;

export function HowItWorksPanel() {
  const [showTechnical, setShowTechnical] = useState(false);

  return (
    <aside className="how-it-works-panel" aria-labelledby="how-it-works-heading">
      <h2 id="how-it-works-heading">How it works</h2>
      <p className="how-it-works-intro">
        Ever wondered what happens when you play? Here&apos;s the journey your sound takes!
      </p>

      <div className="architecture-diagram" aria-hidden="true">
        <div className="arch-step arch-you">You tap and talk</div>
        <div className="arch-arrow">↓</div>
        <div className="arch-step arch-device">Your phone or tablet</div>
        <div className="arch-arrow">↓</div>
        <div className="arch-step arch-game">The game checks your sound</div>
        <div className="arch-arrow">↓</div>
        <div className="arch-step arch-score">You get a score</div>
        <div className="arch-arrow arch-branch">↓ Save my score</div>
        <div className="arch-step arch-cloud">AWS Cloud</div>
        <div className="arch-arrow">↓</div>
        <div className="arch-step arch-board">Leaderboard for everyone</div>
      </div>

      <ol className="how-it-works-steps">
        {STEPS.map((step) => (
          <li key={step.title} className="how-step">
            <span className="how-step-icon" aria-hidden="true">{step.icon}</span>
            <div>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="technical-section">
        <button
          type="button"
          className="technical-toggle"
          onClick={() => setShowTechnical((open) => !open)}
          aria-expanded={showTechnical}
        >
          {showTechnical ? "Hide technical details" : "Tell me more (for grown-ups)"}
        </button>

        {showTechnical && (
          <div className="technical-details">
            <p>
              This is a real cloud app built for a careers-day demo. When code is pushed to
              GitHub, automated tests run and the live site updates within minutes.
            </p>
            <ul>
              {TECH_STACK.map((item) => (
                <li key={item.label}>
                  <strong>{item.label}</strong> — {item.detail}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </aside>
  );
}
