import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  loadReferenceAudioBuffer,
  playReferenceSound,
  stopReferenceSound,
} from "../audio/player";
import {
  hasMicrophoneAccess,
  requestMicrophone,
  startRecording,
} from "../audio/recorder";
import { extractWaveformPeaks } from "../audio/waveform";
import { AnimalPicker } from "../components/AnimalPicker";
import { MicrophonePrimer } from "../components/MicrophonePrimer";
import { ModePicker } from "../components/ModePicker";
import { PrivacyNotice } from "../components/PrivacyNotice";
import { ScoreDisplay } from "../components/ScoreDisplay";
import { SoundWaveVisualizer } from "../components/SoundWaveVisualizer";
import { WaveformCompare } from "../components/WaveformCompare";
import { WaveformDisplay } from "../components/WaveformDisplay";
import { getAnimal } from "../data/animals";
import { useLeaderboard } from "../hooks/useLeaderboard";
import { extractFeatures } from "../scoring/features";
import { getProfile } from "../scoring/profiles";
import { scoreRecording } from "../scoring/scorer";
import type { AnimalId, PlayerMode, ScoreResult } from "../types";

type GameStep =
  | "setup"
  | "ready"
  | "mic-primer"
  | "countdown"
  | "recording"
  | "scored";

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
  const [micLoading, setMicLoading] = useState(false);
  const [referencePeaks, setReferencePeaks] = useState<number[]>([]);
  const [recordingPeaks, setRecordingPeaks] = useState<number[]>([]);
  const [playbackProgress, setPlaybackProgress] = useState<number | undefined>(
    undefined,
  );

  const selectedAnimal = animal ? getAnimal(animal) : null;

  useEffect(() => {
    if (!animal || step === "setup") {
      setReferencePeaks([]);
      setRecordingPeaks([]);
      setPlaybackProgress(undefined);
      return;
    }

    let cancelled = false;
    void loadReferenceAudioBuffer(animal)
      .then((buffer) => {
        if (!cancelled) {
          setReferencePeaks(extractWaveformPeaks(buffer));
        }
      })
      .catch(() => {
        if (!cancelled) setReferencePeaks([]);
      });

    return () => {
      cancelled = true;
    };
  }, [animal, step]);

  function handleLetsPlay() {
    if (!animal) return;
    setError(null);
    setStep("ready");
  }

  async function handlePlayReference() {
    if (!animal) return;
    setIsPlaying(true);
    setError(null);
    setPlaybackProgress(0);
    try {
      await playReferenceSound(animal, {
        onProgress: setPlaybackProgress,
      });
    } catch {
      setError("Could not play the reference sound. Try again.");
      setPlaybackProgress(undefined);
    } finally {
      setIsPlaying(false);
    }
  }

  function handleStartRecord() {
    if (!animal) return;
    setError(null);
    if (!hasMicrophoneAccess()) {
      setStep("mic-primer");
      return;
    }
    void handleRecord();
  }

  async function handleEnableMicrophone() {
    setMicLoading(true);
    setError(null);
    try {
      await requestMicrophone();
      setStep("ready");
      void handleRecord();
    } catch {
      setError(
        "Microphone access was denied. Check your browser settings and try again.",
      );
      setStep("ready");
    } finally {
      setMicLoading(false);
    }
  }

  async function handleRecord() {
    if (!animal) return;
    setError(null);
    setCountdown(3);
    setStep("countdown");

    try {
      const referenceBuffer = await loadReferenceAudioBuffer(animal);
      const { audioBuffer } = await startRecording(
        (secondsLeft) => {
          setCountdown(secondsLeft);
          setStep(secondsLeft > 0 ? "countdown" : "recording");
        },
        referenceBuffer.duration,
      );

      setRecordingPeaks(extractWaveformPeaks(audioBuffer));
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
    setRecordingPeaks(profile.envelope);
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
    stopReferenceSound();
    setResult(null);
    setSubmitted(false);
    setRecordingPeaks([]);
    setPlaybackProgress(undefined);
    setStep("ready");
  }

  function handleBackToSetup() {
    stopReferenceSound();
    setError(null);
    setPlaybackProgress(undefined);
    setStep("setup");
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
          <button
            type="button"
            className="btn btn-primary btn-lets-play"
            onClick={handleLetsPlay}
            disabled={!animal}
          >
            Let&apos;s play!
          </button>
        </>
      )}

      {step === "ready" && selectedAnimal && (
        <div className="ready-panel">
          <p className="ready-animal ready-animal-bounce">
            {selectedAnimal.emoji} {selectedAnimal.name}
          </p>
          <p>Imitate: <strong>{selectedAnimal.soundLabel}</strong></p>
          <WaveformDisplay
            peaks={referencePeaks}
            label={`${selectedAnimal.name} sound`}
            progress={isPlaying ? playbackProgress : undefined}
            variant="reference"
          />
          <button
            type="button"
            className="btn btn-secondary btn-hear-sound"
            onClick={handlePlayReference}
            disabled={isPlaying}
          >
            {isPlaying
              ? "Playing…"
              : `🔊 Hear the ${selectedAnimal.name} sound`}
          </button>
          <button
            type="button"
            className="btn btn-primary btn-record"
            onClick={handleStartRecord}
          >
            🎤 Record my sound
          </button>
          <button type="button" className="btn btn-ghost" onClick={handleDemoScore}>
            Demo mode (no mic needed)
          </button>
          <button type="button" className="btn btn-ghost" onClick={handleBackToSetup}>
            ← Choose a different animal
          </button>
        </div>
      )}

      {step === "mic-primer" && (
        <MicrophonePrimer onEnable={handleEnableMicrophone} loading={micLoading} />
      )}

      {step === "countdown" && countdown > 0 && (
        <div className="countdown-panel">
          <p>Quiet moment…</p>
          <span className="countdown-number countdown-pop">{countdown}</span>
        </div>
      )}

      {(step === "recording" || (step === "countdown" && countdown === 0)) && (
        <div className="recording-panel">
          {referencePeaks.length > 0 && (
            <WaveformDisplay
              peaks={referencePeaks}
              label={`${selectedAnimal?.name} sound`}
              variant="reference"
            />
          )}
          <SoundWaveVisualizer active={step === "recording"} />
          <span className="recording-pulse">🎤</span>
          <p>Recording… make your best {selectedAnimal?.soundLabel}</p>
        </div>
      )}

      {step === "scored" && result && selectedAnimal && (
        <div className="scored-panel">
          <WaveformCompare
            referencePeaks={referencePeaks}
            recordingPeaks={recordingPeaks}
            referenceLabel={`${selectedAnimal.name} sound`}
          />
          <ScoreDisplay result={result} practiceMode={practiceMode} />
          {!practiceMode && !submitted && (
            <div className="submit-form">
              <label className="nickname-label" htmlFor="nickname">
                Choose a fun nickname
              </label>
              <input
                id="nickname"
                type="text"
                placeholder="e.g. SuperMoo42"
                maxLength={20}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="nickname-input"
                autoComplete="off"
              />
              <PrivacyNotice compact />
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
