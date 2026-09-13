import type { AnimalId } from "../types";

import catSound from "@assets/sounds/cat.mp3";
import cowSound from "@assets/sounds/cow.mp3";
import dogSound from "@assets/sounds/dog.mp3";
import duckSound from "@assets/sounds/duck.mp3";
import sheepSound from "@assets/sounds/sheep.mp3";

const REFERENCE_SOUNDS: Record<AnimalId, string> = {
  cow: cowSound,
  dog: dogSound,
  cat: catSound,
  sheep: sheepSound,
  duck: duckSound,
};

let audioContext: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;
let progressRaf = 0;
const bufferCache = new Map<AnimalId, AudioBuffer>();

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

function stopCurrentPlayback(): void {
  cancelAnimationFrame(progressRaf);
  if (currentSource) {
    try {
      currentSource.stop();
    } catch {
      // Already stopped.
    }
    currentSource.disconnect();
    currentSource = null;
  }
}

export async function loadReferenceAudioBuffer(
  animalId: AnimalId,
): Promise<AudioBuffer> {
  const cached = bufferCache.get(animalId);
  if (cached) return cached;

  const ctx = getAudioContext();
  const response = await fetch(REFERENCE_SOUNDS[animalId]);
  if (!response.ok) {
    throw new Error("Could not load the reference sound.");
  }
  const arrayBuffer = await response.arrayBuffer();
  const buffer = await ctx.decodeAudioData(arrayBuffer);
  bufferCache.set(animalId, buffer);
  return buffer;
}

export interface PlayReferenceOptions {
  onProgress?: (progress: number) => void;
}

export async function playReferenceSound(
  animalId: AnimalId,
  options?: PlayReferenceOptions,
): Promise<void> {
  stopCurrentPlayback();

  const ctx = getAudioContext();
  if (ctx.state === "suspended") {
    await ctx.resume();
  }

  const buffer = await loadReferenceAudioBuffer(animalId);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  currentSource = source;

  const duration = buffer.duration;
  const startTime = ctx.currentTime;

  await new Promise<void>((resolve, reject) => {
    source.onended = () => {
      options?.onProgress?.(1);
      resolve();
    };

    const tick = () => {
      const elapsed = ctx.currentTime - startTime;
      options?.onProgress?.(Math.min(1, elapsed / duration));
      if (elapsed < duration) {
        progressRaf = requestAnimationFrame(tick);
      }
    };

    try {
      source.start();
      progressRaf = requestAnimationFrame(tick);
    } catch (err) {
      reject(
        err instanceof Error
          ? err
          : new Error("Could not play the reference sound."),
      );
    }
  });
}

export function stopReferenceSound(): void {
  stopCurrentPlayback();
}
