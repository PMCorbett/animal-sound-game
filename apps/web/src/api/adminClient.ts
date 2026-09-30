import type { AnimalId, LeaderboardEntry } from "../types";
import { ApiError, isApiConfigured } from "./client";

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "";

const ADMIN_HEADERS = {
  "Content-Type": "application/json",
  "X-Requested-With": "XMLHttpRequest",
};

async function parseError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error ?? response.statusText;
  } catch {
    return response.statusText;
  }
}

function assertApiConfigured(): void {
  if (!isApiConfigured()) {
    throw new ApiError("API is not configured", 0);
  }
}

export function getGithubAuthStartUrl(): string {
  assertApiConfigured();
  return `${API_URL}/admin/auth/github`;
}

export async function fetchAdminSession(): Promise<{
  authenticated: boolean;
  login?: string;
}> {
  assertApiConfigured();

  const response = await fetch(`${API_URL}/admin/session`, {
    credentials: "include",
  });

  if (response.status === 401) {
    return { authenticated: false };
  }

  if (!response.ok) {
    throw new ApiError(await parseError(response), response.status);
  }

  const body = (await response.json()) as {
    authenticated: boolean;
    login: string;
  };
  return body;
}

export async function adminLogout(): Promise<void> {
  assertApiConfigured();

  const response = await fetch(`${API_URL}/admin/logout`, {
    method: "POST",
    credentials: "include",
    headers: ADMIN_HEADERS,
  });

  if (!response.ok && response.status !== 204) {
    throw new ApiError(await parseError(response), response.status);
  }
}

export async function fetchAdminLeaderboard(options?: {
  animal?: AnimalId;
  mode?: "child" | "grownup";
  limit?: number;
}): Promise<LeaderboardEntry[]> {
  assertApiConfigured();

  const params = new URLSearchParams();
  if (options?.animal) params.set("animal", options.animal);
  if (options?.mode) params.set("mode", options.mode);
  params.set("limit", String(options?.limit ?? 100));

  const query = params.toString();
  const response = await fetch(`${API_URL}/admin/leaderboard?${query}`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new ApiError(await parseError(response), response.status);
  }

  const body = (await response.json()) as { entries: LeaderboardEntry[] };
  return body.entries;
}

export async function adminDeleteScore(
  id: string,
  animal: AnimalId,
): Promise<void> {
  assertApiConfigured();

  const response = await fetch(`${API_URL}/admin/scores`, {
    method: "DELETE",
    credentials: "include",
    headers: ADMIN_HEADERS,
    body: JSON.stringify({ id, animal }),
  });

  if (!response.ok && response.status !== 204) {
    throw new ApiError(await parseError(response), response.status);
  }
}

export async function adminUpdateNickname(
  id: string,
  animal: AnimalId,
  nickname: string,
): Promise<LeaderboardEntry> {
  assertApiConfigured();

  const response = await fetch(`${API_URL}/admin/scores`, {
    method: "PATCH",
    credentials: "include",
    headers: ADMIN_HEADERS,
    body: JSON.stringify({ id, animal, nickname }),
  });

  if (!response.ok) {
    throw new ApiError(await parseError(response), response.status);
  }

  const body = (await response.json()) as { entry: LeaderboardEntry };
  return body.entry;
}

export function adminLoginErrorMessage(code: string | null): string | null {
  if (!code) {
    return null;
  }

  switch (code) {
    case "not_allowed":
      return "Your GitHub account is not authorized for admin access.";
    case "oauth_failed":
      return "GitHub sign-in failed. Try again.";
    case "oauth_state":
      return "Sign-in session expired. Try again.";
    case "rate_limited":
      return "Too many sign-in attempts. Wait a while and try again.";
    case "not_configured":
      return "Admin sign-in is not configured on the server yet.";
    default:
      return "Sign-in failed.";
  }
}
