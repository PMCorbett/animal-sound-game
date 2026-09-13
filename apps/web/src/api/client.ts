import type { AnimalId, LeaderboardEntry, PlayerMode } from "../types";

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "";

export function isApiConfigured(): boolean {
  return API_URL.length > 0;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function parseError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error ?? response.statusText;
  } catch {
    return response.statusText;
  }
}

export async function fetchLeaderboard(options?: {
  animal?: AnimalId;
  mode?: PlayerMode;
  limit?: number;
}): Promise<LeaderboardEntry[]> {
  if (!isApiConfigured()) {
    return [];
  }

  const params = new URLSearchParams();
  if (options?.animal) params.set("animal", options.animal);
  if (options?.mode) params.set("mode", options.mode);
  if (options?.limit) params.set("limit", String(options.limit));

  const query = params.toString();
  const url = `${API_URL}/leaderboard${query ? `?${query}` : ""}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new ApiError(await parseError(response), response.status);
  }

  const body = (await response.json()) as { entries: LeaderboardEntry[] };
  return body.entries;
}

export async function submitScoreToApi(
  nickname: string,
  animal: AnimalId,
  score: number,
  mode: PlayerMode,
): Promise<LeaderboardEntry> {
  if (!isApiConfigured()) {
    throw new ApiError("API is not configured", 0);
  }

  const response = await fetch(`${API_URL}/scores`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nickname, animal, score, mode }),
  });

  if (!response.ok) {
    throw new ApiError(await parseError(response), response.status);
  }

  const body = (await response.json()) as { entry: LeaderboardEntry };
  return body.entry;
}
