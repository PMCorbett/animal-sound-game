const MAX_RECORDING_SECONDS = 5;

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

export async function startRecording(
  onCountdownTick?: (secondsLeft: number) => void,
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

  mediaRecorder.start();
  await new Promise((resolve) => setTimeout(resolve, MAX_RECORDING_SECONDS * 1000));
  mediaRecorder.stop();

  const blob = await recordingPromise;

  if (!audioContext) {
    audioContext = new AudioContext();
  }
  const arrayBuffer = await blob.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  return { blob, audioBuffer };
}

export function stopMediaStream(): void {
  mediaStream?.getTracks().forEach((track) => track.stop());
  mediaStream = null;
}
