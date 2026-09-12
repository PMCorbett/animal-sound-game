import type { AnimalId } from "../types";

/** Synthesized reference sounds — swap for CDN-hosted MP3s in production. */
const REFERENCE_SOUNDS: Record<
  AnimalId,
  { frequencies: number[]; durations: number[]; type: OscillatorType }
> = {
  cow: {
    frequencies: [120, 110, 100, 95, 90],
    durations: [0.3, 0.3, 0.3, 0.3, 0.3],
    type: "sawtooth",
  },
  dog: {
    frequencies: [280, 320, 260],
    durations: [0.12, 0.1, 0.15],
    type: "square",
  },
  cat: {
    frequencies: [400, 450, 380, 350],
    durations: [0.15, 0.2, 0.15, 0.2],
    type: "triangle",
  },
  sheep: {
    frequencies: [300, 350, 280, 320],
    durations: [0.15, 0.15, 0.15, 0.15],
    type: "sawtooth",
  },
  duck: {
    frequencies: [350, 400, 320],
    durations: [0.1, 0.12, 0.1],
    type: "square",
  },
};

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

export async function playReferenceSound(animalId: AnimalId): Promise<void> {
  const ctx = getAudioContext();
  if (ctx.state === "suspended") {
    await ctx.resume();
  }

  const sound = REFERENCE_SOUNDS[animalId];
  let startTime = ctx.currentTime;

  for (let i = 0; i < sound.frequencies.length; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = sound.type;
    osc.frequency.value = sound.frequencies[i];
    gain.gain.setValueAtTime(0.15, startTime);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + sound.durations[i]);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + sound.durations[i]);
    startTime += sound.durations[i] * 0.85;
  }

  await new Promise((resolve) => {
    setTimeout(resolve, (startTime - ctx.currentTime) * 1000 + 100);
  });
}
