import type { AnimalId, PlayerMode, SubmitScoreBody } from "../types.js";
import { ANIMAL_IDS } from "../types.js";

const MAX_NICKNAME_LENGTH = 20;
const MIN_SCORE = 0;
const MAX_SCORE = 100;

export function parseSubmitBody(raw: unknown): SubmitScoreBody {
  if (!raw || typeof raw !== "object") {
    throw new ValidationError("Request body must be a JSON object");
  }

  const body = raw as Record<string, unknown>;
  const nickname = typeof body.nickname === "string" ? body.nickname.trim() : "";
  const animal = body.animal;
  const mode = body.mode;
  const score = body.score;

  if (!nickname || nickname.length > MAX_NICKNAME_LENGTH) {
    throw new ValidationError("Nickname must be 1–20 characters");
  }

  if (!ANIMAL_IDS.includes(animal as AnimalId)) {
    throw new ValidationError("Invalid animal");
  }

  if (mode !== "child" && mode !== "grownup") {
    throw new ValidationError("Mode must be child or grownup");
  }

  if (typeof score !== "number" || !Number.isFinite(score)) {
    throw new ValidationError("Score must be a number");
  }

  const roundedScore = Math.round(score);
  if (roundedScore < MIN_SCORE || roundedScore > MAX_SCORE) {
    throw new ValidationError("Score must be between 0 and 100");
  }

  return {
    nickname,
    animal: animal as AnimalId,
    mode: mode as PlayerMode,
    score: roundedScore,
  };
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export function parseLeaderboardQuery(params: Record<string, string | undefined>): {
  animal?: AnimalId;
  mode?: PlayerMode;
  limit: number;
} {
  const animal = params.animal;
  const mode = params.mode;
  const limitRaw = params.limit ?? "20";

  if (animal && !ANIMAL_IDS.includes(animal as AnimalId)) {
    throw new ValidationError("Invalid animal");
  }

  if (mode && mode !== "child" && mode !== "grownup") {
    throw new ValidationError("Mode must be child or grownup");
  }

  const limit = Number.parseInt(limitRaw, 10);
  if (!Number.isFinite(limit) || limit < 1 || limit > 100) {
    throw new ValidationError("Limit must be between 1 and 100");
  }

  return {
    animal: animal as AnimalId | undefined,
    mode: mode as PlayerMode | undefined,
    limit,
  };
}

export function parseAdminScoreRef(raw: unknown): {
  id: string;
  animal: AnimalId;
} {
  if (!raw || typeof raw !== "object") {
    throw new ValidationError("Request body must be a JSON object");
  }

  const body = raw as Record<string, unknown>;
  const id = typeof body.id === "string" ? body.id.trim() : "";
  const animal = body.animal;

  if (!id || !id.startsWith("SCORE#")) {
    throw new ValidationError("Invalid score id");
  }

  if (!ANIMAL_IDS.includes(animal as AnimalId)) {
    throw new ValidationError("Invalid animal");
  }

  return { id, animal: animal as AnimalId };
}

export function parseAdminNicknameUpdate(raw: unknown): {
  id: string;
  animal: AnimalId;
  nickname: string;
} {
  if (!raw || typeof raw !== "object") {
    throw new ValidationError("Request body must be a JSON object");
  }

  const ref = parseAdminScoreRef(raw);
  const body = raw as Record<string, unknown>;
  const nickname =
    typeof body.nickname === "string" ? body.nickname.trim() : "";

  if (!nickname || nickname.length > MAX_NICKNAME_LENGTH) {
    throw new ValidationError("Nickname must be 1–20 characters");
  }

  return { ...ref, nickname };
}
