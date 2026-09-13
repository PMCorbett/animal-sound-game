import {
  SOUND_ACTIVITY_THRESHOLD,
  trimRecordingFromOnset,
} from "../scoring/features";

const ONSET_CHECK_INTERVAL_MS = 50;
const MAX_ONSET_WAIT_SECONDS = 5;

export type RecordingState = "idle" | "countdown" | "recording" | "processing";

export interface RecordingResult {
  blob: Blob;
  audioBuffer: AudioBuffer;
}

let mediaStream: MediaStream | null = null;
let mediaRecorder: MediaRecorder | null = null;
let audioContext: AudioContext | null = null;

function getMimeType(): string {
  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];
  return types.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

export async function requestMicrophone(): Promise<void> {
  if (mediaStream) return;
  mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
}

export function hasMicrophoneAccess(): boolean {
  return mediaStream !== null;
}

/** Active mic stream for live visualisation during recording. */
export function getMediaStream(): MediaStream | null {
  return mediaStream;
}

function analyserRms(analyser: AnalyserNode): number {
  const data = new Float32Array(analyser.fftSize);
  analyser.getFloatTimeDomainData(data);
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data[i] * data[i];
  }
  return Math.sqrt(sum / data.length);
}

async function waitForSoundOnset(
  stream: MediaStream,
  ctx: AudioContext,
  maxWaitMs: number,
): Promise<void> {
  const source = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 2048;
  source.connect(analyser);

  const deadline = Date.now() + maxWaitMs;

  try {
    while (Date.now() < deadline) {
      if (analyserRms(analyser) >= SOUND_ACTIVITY_THRESHOLD) {
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, ONSET_CHECK_INTERVAL_MS));
    }
    throw new Error(
      "We didn't hear anything. Try again when you're ready to make your sound.",
    );
  } finally {
    source.disconnect();
  }
}

export async function startRecording(
  onCountdownTick?: (secondsLeft: number) => void,
  durationSeconds?: number,
): Promise<RecordingResult> {
  await requestMicrophone();
  if (!mediaStream) {
    throw new Error("Microphone access is required to record.");
  }

  for (let i = 3; i > 0; i--) {
    onCountdownTick?.(i);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  onCountdownTick?.(0);

  const mimeType = getMimeType();
  const chunks: Blob[] = [];

  mediaRecorder = new MediaRecorder(mediaStream, mimeType ? { mimeType } : {});
  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  };

  const recordingPromise = new Promise<Blob>((resolve, reject) => {
    mediaRecorder!.onstop = () => {
      resolve(new Blob(chunks, { type: mimeType || "audio/webm" }));
    };
    mediaRecorder!.onerror = () => reject(new Error("Recording failed."));
  });

  if (!durationSeconds || durationSeconds <= 0) {
    throw new Error("Recording duration must be greater than zero.");
  }

  if (!audioContext) {
    audioContext = new AudioContext();
  }
  if (audioContext.state === "suspended") {
    await audioContext.resume();
  }

  mediaRecorder.start();
  await waitForSoundOnset(
    mediaStream,
    audioContext,
    MAX_ONSET_WAIT_SECONDS * 1000,
  );
  await new Promise((resolve) =>
    setTimeout(resolve, durationSeconds * 1000),
  );
  mediaRecorder.stop();

  const blob = await recordingPromise;

  const arrayBuffer = await blob.arrayBuffer();
  const decoded = await audioContext.decodeAudioData(arrayBuffer);
  const audioBuffer = trimRecordingFromOnset(
    decoded,
    durationSeconds,
    audioContext,
  );

  return { blob, audioBuffer };
}

export function stopMediaStream(): void {
  mediaStream?.getTracks().forEach((track) => track.stop());
  mediaStream = null;
}
