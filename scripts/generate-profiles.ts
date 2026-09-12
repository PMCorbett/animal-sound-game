import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { extractFeaturesFromChannel } from "../apps/web/src/scoring/features.ts";
import type { AnimalId, ScoringProfile } from "../apps/web/src/types/index.ts";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const soundsDir = join(repoRoot, "assets/sounds");
const profilesDir = join(repoRoot, "assets/profiles");

const ANIMALS: AnimalId[] = ["cow", "dog", "cat", "sheep", "duck"];

function round(value: number, decimals = 3): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function roundArray(values: number[], decimals = 2): number[] {
  return values.map((value) => round(value, decimals));
}

function decodeAudio(filePath: string): { samples: Float32Array; sampleRate: number } {
  const buffer = execFileSync(
    "ffmpeg",
    [
      "-hide_banner",
      "-loglevel",
      "error",
      "-i",
      filePath,
      "-f",
      "f32le",
      "-ac",
      "1",
      "-ar",
      "44100",
      "pipe:1",
    ],
    { encoding: "buffer", maxBuffer: 50 * 1024 * 1024 },
  );

  return {
    samples: new Float32Array(
      buffer.buffer,
      buffer.byteOffset,
      buffer.byteLength / Float32Array.BYTES_PER_ELEMENT,
    ),
    sampleRate: 44100,
  };
}

function buildProfile(animal: AnimalId): ScoringProfile {
  const existing = JSON.parse(
    readFileSync(join(profilesDir, `${animal}.json`), "utf8"),
  ) as ScoringProfile;

  const soundPath = join(soundsDir, `${animal}.mp3`);
  const { samples, sampleRate } = decodeAudio(soundPath);
  const features = extractFeaturesFromChannel(samples, sampleRate);

  const ideal = round(features.duration);
  const min = round(Math.max(0.15, ideal * 0.5));
  const max = round(ideal * 1.7);

  return {
    animal,
    duration: { min, max, ideal },
    pitch: {
      minHz: features.pitchHz.min,
      maxHz: features.pitchHz.max,
      contour: roundArray(features.pitchContour),
    },
    envelope: roundArray(features.envelope),
    mfcc: features.mfcc.map((value) => round(value, 1)),
    encouragingMessages: existing.encouragingMessages,
  };
}

for (const animal of ANIMALS) {
  const profile = buildProfile(animal);
  const outputPath = join(profilesDir, `${animal}.json`);
  writeFileSync(outputPath, `${JSON.stringify(profile, null, 2)}\n`);
  console.log(
    `${animal}: ideal=${profile.duration.ideal}s, pitch=${profile.pitch.minHz}-${profile.pitch.maxHz}Hz`,
  );
}
