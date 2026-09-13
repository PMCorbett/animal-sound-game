import { useState } from "react";
import { Link } from "react-router-dom";
import { playReferenceSound } from "../audio/player";
import { startRecording } from "../audio/recorder";
import { AnimalPicker } from "../components/AnimalPicker";
import { ModePicker } from "../components/ModePicker";
import { ScoreDisplay } from "../components/ScoreDisplay";
import { getAnimal } from "../data/animals";
import { useLeaderboard } from "../hooks/useLeaderboard";
import { extractFeatures } from "../scoring/features";
import { getProfile } from "../scoring/profiles";
import { scoreRecording } from "../scoring/scorer";
import type { AnimalId, PlayerMode, ScoreResult } from "../types";

type GameStep = "setup" | "ready" | "countdown" | "recording" | "scored";

export function PlayPage() {
  const { submitScore } = useLeaderboard();
  const [mode, setMode] = useState<PlayerMode>("child");
  const [animal, setAnimal] = useState<AnimalId | null>(null);
  const [step, setStep] = useState<GameStep>("setup");
  const [countdown, setCountdown] = useState(0);
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [practiceMode, setPracticeMode] = useState(false);
  const [nickname, setNickname] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const selectedAnimal = animal ? getAnimal(animal) : null;

  async function handlePlayReference() {
    if (!animal) return;
    setIsPlaying(true);
    setError(null);
    try {
      await playReferenceSound(animal);
      setStep("ready");
    } catch {
      setError("Could not play the reference sound. Try again.");
    } finally {
      setIsPlaying(false);
    }
  }

  async function handleRecord() {
    if (!animal) return;
    setError(null);
    setStep("countdown");

    try {
      const { audioBuffer } = await startRecording((secondsLeft) => {
        setCountdown(secondsLeft);
        setStep(secondsLeft > 0 ? "countdown" : "recording");
      });

      setStep("recording");
      const features = extractFeatures(audioBuffer);
      const profile = getProfile(animal);
      const scoreResult = scoreRecording(features, profile, mode);
      setResult(scoreResult);
      setSubmitted(false);
      setStep("scored");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Recording failed. Try again.",
      );
      setStep("ready");
    }
  }

  function handleDemoScore() {
    if (!animal) return;
    const profile = getProfile(animal);
    const demoResult = scoreRecording(
      {
        duration: profile.duration.ideal,
        pitchContour: profile.pitch.contour,
        pitchHz: { min: profile.pitch.minHz, max: profile.pitch.maxHz },
        envelope: profile.envelope,
        mfcc: profile.mfcc,
      },
      profile,
      mode,
    );
    setResult(demoResult);
    setSubmitted(false);
    setStep("scored");
  }

  async function handleSubmit() {
    if (!animal || !result || !nickname.trim() || practiceMode) return;
    setError(null);
    try {
      await submitScore(nickname.trim(), animal, result.finalScore, mode);
      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save score. Try again.",
      );
    }
  }

  function handlePlayAgain() {
    setResult(null);
    setSubmitted(false);
    setStep(animal ? "ready" : "setup");
  }

  return (
    <div className="play-page">
      <header className="page-header">
        <h1>Animal Sound Game</h1>
        <p>Imitate the animal sound and get a score!</p>
      </header>

      {step === "setup" && (
        <>
          <ModePicker mode={mode} onChange={setMode} />
          <AnimalPicker selected={animal} onSelect={setAnimal} />
          <label className="practice-toggle">
            <input
              type="checkbox"
              checked={practiceMode}
              onChange={(e) => setPracticeMode(e.target.checked)}
            />
            Practice mode (score but don&apos;t save)
          </label>
          {animal && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handlePlayReference}
              disabled={isPlaying}
            >
              {isPlaying ? "Playing…" : `Hear the ${selectedAnimal?.name} sound`}
            </button>
          )}
        </>
      )}

      {step === "ready" && selectedAnimal && (
        <div className="ready-panel">
          <p className="ready-animal">
            {selectedAnimal.emoji} {selectedAnimal.name}
          </p>
          <p>Get ready to imitate: <strong>{selectedAnimal.soundLabel}</strong></p>
          <div className="action-row">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handlePlayReference}
              disabled={isPlaying}
            >
              Hear again
            </button>
            <button type="button" className="btn btn-primary btn-record" onClick={handleRecord}>
              🎤 Record my sound
            </button>
          </div>
          <button type="button" className="btn btn-ghost" onClick={handleDemoScore}>
            Demo mode (no mic needed)
          </button>
        </div>
      )}

      {step === "countdown" && countdown > 0 && (
        <div className="countdown-panel">
          <p>Quiet moment…</p>
          <span className="countdown-number">{countdown}</span>
        </div>
      )}

      {step === "recording" && (
        <div className="recording-panel">
          <span className="recording-pulse">🎤</span>
          <p>Recording… make your best {selectedAnimal?.soundLabel}</p>
        </div>
      )}

      {step === "scored" && result && (
        <div className="scored-panel">
          <ScoreDisplay result={result} practiceMode={practiceMode} />
          {!practiceMode && !submitted && (
            <div className="submit-form">
              <input
                type="text"
                placeholder="Your nickname (max 20 chars)"
                maxLength={20}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="nickname-input"
              />
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={!nickname.trim()}
              >
                Save to leaderboard
              </button>
            </div>
          )}
          {submitted && (
            <p className="submit-success">
              Score saved! <Link to="/leaderboard">View leaderboard →</Link>
            </p>
          )}
          <button type="button" className="btn btn-secondary" onClick={handlePlayAgain}>
            Play again
          </button>
        </div>
      )}

      {error && <p className="error-message" role="alert">{error}</p>}

      <nav className="page-nav">
        <Link to="/leaderboard">View leaderboard</Link>
      </nav>
    </div>
  );
}
