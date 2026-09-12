import type { AnimalId, ScoringProfile } from "../types";

import cowProfile from "@assets/profiles/cow.json";
import dogProfile from "@assets/profiles/dog.json";
import catProfile from "@assets/profiles/cat.json";
import sheepProfile from "@assets/profiles/sheep.json";
import duckProfile from "@assets/profiles/duck.json";

const profiles: Record<AnimalId, ScoringProfile> = {
  cow: cowProfile as ScoringProfile,
  dog: dogProfile as ScoringProfile,
  cat: catProfile as ScoringProfile,
  sheep: sheepProfile as ScoringProfile,
  duck: duckProfile as ScoringProfile,
};

export function getProfile(animalId: AnimalId): ScoringProfile {
  return profiles[animalId];
}
