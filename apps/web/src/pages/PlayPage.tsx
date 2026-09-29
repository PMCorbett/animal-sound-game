import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  loadReferenceAudioBuffer,
  playReferenceSound,
  stopReferenceSound,
} from "../audio/player";
import { unlockAudioOnUserGesture } from "../audio/unlock";
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
import { ScoreBreakdown, ScoreDisplay } from "../components/ScoreDisplay";
import { SoundWaveVisualizer } from "../components/SoundWaveVisualizer";
import { WaveformCompare } from "../components/WaveformCompare";
import { WaveformDisplay } from "../components/WaveformDisplay";
import { WizardStepPanel } from "../components/WizardStepPanel";
import { getAnimal } from "../data/animals";
import { useLeaderboard } from "../hooks/useLeaderboard";
import { extractFeatures } from "../scoring/features";
import { getProfile } from "../scoring/profiles";
import { scoreRecording } from "../scoring/scorer";
import type { AnimalId, PlayerMode, ScoreResult } from "../types";

type GameStep =
  | "pickMode"
  | "pickAnimal"
  | "confirmPlay"
  | "ready"
  | "mic-primer"
  | "countdown"
  | "recording"
  | "showScore"
  | "enterNickname"
  | "finish";

function WizardBack({
  onClick,
  label = "← Back",
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <nav className="wizard-back-row">
      <button type="button" className="wizard-back" onClick={onClick}>
        {label}
      </button>
    </nav>
  );
}

export function PlayPage() {
  const { submitScore } = useLeaderboard();
  const [mode, setMode] = useState<PlayerMode>("child");
  const [animal, setAnimal] = useState<AnimalId | null>(null);
  const [step, setStep] = useState<GameStep>("pickMode");
  const [countdown, setCountdown] = useState(0);
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [nickname, setNickname] = useState("");
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
    if (!animal || step === "pickMode" || step === "pickAnimal") {
      if (step === "pickMode" || step === "pickAnimal") {
        setReferencePeaks([]);
        setRecordingPeaks([]);
        setPlaybackProgress(undefined);
      }
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

  function handleModeSelect(nextMode: PlayerMode) {
    setMode(nextMode);
    setStep("pickAnimal");
  }

  function handleAnimalSelect(animalId: AnimalId) {
    setAnimal(animalId);
    setStep("confirmPlay");
  }

  function handleLetsPlay() {
    if (!animal) return;
    unlockAudioOnUserGesture();
    setError(null);
    setStep("ready");
  }

  async function handlePlayReference() {
    if (!animal) return;
    unlockAudioOnUserGesture();
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
    unlockAudioOnUserGesture();
    setError(null);
    if (!hasMicrophoneAccess()) {
      setStep("mic-primer");
      return;
    }
    void handleRecord();
  }

  async function handleEnableMicrophone() {
    unlockAudioOnUserGesture();
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
      setStep("showScore");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Recording failed. Try again.",
      );
      setStep("ready");
    }
  }

  async function handleSubmit() {
    if (!animal || !result || !nickname.trim()) return;
    setError(null);
    try {
      await submitScore(nickname.trim(), animal, result.finalScore, mode);
      setStep("finish");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save score. Try again.",
      );
    }
  }

  function handlePlayAgain() {
    stopReferenceSound();
    setResult(null);
    setNickname("");
    setRecordingPeaks([]);
    setPlaybackProgress(undefined);
    setAnimal(null);
    setError(null);
    setStep("pickMode");
  }

  function handleBackToConfirmPlay() {
    stopReferenceSound();
    setError(null);
    setPlaybackProgress(undefined);
    setStep("confirmPlay");
  }

  function handleBackToReadyFromScore() {
    stopReferenceSound();
    setError(null);
    setResult(null);
    setRecordingPeaks([]);
    setPlaybackProgress(undefined);
    setStep("ready");
  }

  const modeLabel = mode === "child" ? "Kid" : "Grown-up";

  return (
    <div className="play-page">
      {step === "pickMode" && (
        <WizardStepPanel stepKey="pickMode">
          <nav className="wizard-back-row">
            <Link to="/" className="wizard-back">
              ← Home
            </Link>
          </nav>
          <header className="page-header">
            <h1>Animal Sound Game</h1>
          </header>
          <ModePicker onSelect={handleModeSelect} />
        </WizardStepPanel>
      )}

      {step === "pickAnimal" && (
        <WizardStepPanel stepKey="pickAnimal">
          <WizardBack onClick={() => setStep("pickMode")} />
          <AnimalPicker selected={animal} onSelect={handleAnimalSelect} />
        </WizardStepPanel>
      )}

      {step === "confirmPlay" && selectedAnimal && (
        <WizardStepPanel stepKey="confirmPlay">
          <WizardBack onClick={() => setStep("pickAnimal")} />
          <div className="confirm-play-panel">
            <p className="ready-animal ready-animal-bounce">
              {selectedAnimal.emoji} {selectedAnimal.name}
            </p>
            <p className="confirm-play-hint">
              You will imitate: <strong>{selectedAnimal.soundLabel}</strong>
            </p>
            <p className="confirm-play-mode">
              Mode: <strong>{modeLabel}</strong>
            </p>
            <button
              type="button"
              className="btn btn-primary btn-lets-play"
              onClick={handleLetsPlay}
            >
              Let&apos;s play!
            </button>
          </div>
        </WizardStepPanel>
      )}

      {step === "ready" && selectedAnimal && (
        <WizardStepPanel stepKey="ready">
          <WizardBack onClick={handleBackToConfirmPlay} />
          <div className="ready-panel">
            <p className="ready-animal ready-animal-bounce">
              {selectedAnimal.emoji} {selectedAnimal.name}
            </p>
            <p>
              Imitate: <strong>{selectedAnimal.soundLabel}</strong>
            </p>
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
          </div>
        </WizardStepPanel>
      )}

      {step === "mic-primer" && (
        <WizardStepPanel stepKey="mic-primer">
          <MicrophonePrimer onEnable={handleEnableMicrophone} loading={micLoading} />
        </WizardStepPanel>
      )}

      {step === "countdown" && countdown > 0 && (
        <WizardStepPanel stepKey="countdown">
          <div className="countdown-panel">
            <p>Quiet moment…</p>
            <span className="countdown-number countdown-pop">{countdown}</span>
          </div>
        </WizardStepPanel>
      )}

      {(step === "recording" || (step === "countdown" && countdown === 0)) && (
        <WizardStepPanel stepKey="recording">
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
        </WizardStepPanel>
      )}

      {step === "showScore" && result && selectedAnimal && (
        <WizardStepPanel stepKey="showScore">
          <WizardBack onClick={handleBackToReadyFromScore} />
          <div className="scored-panel">
            <WaveformCompare
              referencePeaks={referencePeaks}
              recordingPeaks={recordingPeaks}
              referenceLabel={`${selectedAnimal.name} sound`}
            />
            <ScoreDisplay result={result} />
            <div className="wizard-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setStep("enterNickname")}
              >
                Continue
              </button>
            </div>
            <ScoreBreakdown result={result} />
          </div>
        </WizardStepPanel>
      )}

      {step === "enterNickname" && result && (
        <WizardStepPanel stepKey="enterNickname">
          <WizardBack onClick={() => setStep("showScore")} />
          <div className="submit-form">
            <h2>Pick a fun nickname</h2>
            <label className="nickname-label" htmlFor="nickname">
              This name goes on the leaderboard
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
              onClick={() => void handleSubmit()}
              disabled={!nickname.trim()}
            >
              Save to leaderboard
            </button>
          </div>
        </WizardStepPanel>
      )}

      {step === "finish" && (
        <WizardStepPanel stepKey="finish">
          <div className="finish-panel">
            <p className="submit-success">Your score is saved. Great job!</p>
            <div className="wizard-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={handlePlayAgain}
              >
                Play again
              </button>
              <Link to="/leaderboard" className="btn btn-secondary">
                View leaderboard
              </Link>
            </div>
          </div>
        </WizardStepPanel>
      )}

      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
