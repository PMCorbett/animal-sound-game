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

let currentAudio: HTMLAudioElement | null = null;

export async function playReferenceSound(animalId: AnimalId): Promise<void> {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }

  const audio = new Audio(REFERENCE_SOUNDS[animalId]);
  currentAudio = audio;

  await new Promise<void>((resolve, reject) => {
    audio.onended = () => resolve();
    audio.onerror = () => reject(new Error("Could not play the reference sound."));
    audio.play().catch(reject);
  });
}
