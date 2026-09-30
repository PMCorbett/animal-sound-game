import { loadAdminAuthSecrets } from "./secrets.js";

export const SESSION_COOKIE_NAME = "admin_session";
export const OAUTH_STATE_COOKIE_NAME = "admin_oauth_state";
export const SESSION_TTL_SECONDS = 8 * 60 * 60;
export const OAUTH_STATE_TTL_SECONDS = 10 * 60;
export const DEFAULT_ADMIN_ALLOWLIST = "PMCorbett";

export function githubClientId(): string {
  return process.env.GITHUB_CLIENT_ID?.trim() ?? "";
}

export function adminOAuthRedirectUri(): string {
  return process.env.ADMIN_OAUTH_REDIRECT_URI?.trim() ?? "";
}

export function webAdminSuccessUrl(): string {
  return process.env.WEB_ADMIN_SUCCESS_URL?.trim() ?? "";
}

export function adminGithubAllowlist(): Set<string> {
  const raw =
    process.env.ADMIN_GITHUB_ALLOWLIST?.trim() || DEFAULT_ADMIN_ALLOWLIST;
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
}

export async function isAdminAuthConfigured(): Promise<boolean> {
  const secrets = await loadAdminAuthSecrets();
  return (
    githubClientId().length > 0 &&
    secrets.githubClientSecret.length > 0 &&
    secrets.githubClientSecret !== "REPLACE_ME" &&
    secrets.sessionSecret.length > 0 &&
    adminOAuthRedirectUri().length > 0 &&
    webAdminSuccessUrl().length > 0
  );
}

export function isAllowlistedGithubLogin(login: string): boolean {
  return adminGithubAllowlist().has(login.trim().toLowerCase());
}
