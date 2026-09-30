export const SESSION_COOKIE_NAME = "admin_session";
export const OAUTH_STATE_COOKIE_NAME = "admin_oauth_state";
export const SESSION_TTL_SECONDS = 8 * 60 * 60;
export const OAUTH_STATE_TTL_SECONDS = 10 * 60;
export const DEFAULT_ADMIN_ALLOWLIST = "PMCorbett";

export function githubClientId(): string {
  return process.env.GITHUB_CLIENT_ID?.trim() ?? "";
}

export function githubClientSecret(): string {
  return process.env.GITHUB_CLIENT_SECRET?.trim() ?? "";
}

export function sessionSecret(): string {
  return process.env.SESSION_SECRET?.trim() ?? "";
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

export function isAdminAuthConfigured(): boolean {
  return (
    githubClientId().length > 0 &&
    githubClientSecret().length > 0 &&
    sessionSecret().length > 0 &&
    adminOAuthRedirectUri().length > 0 &&
    webAdminSuccessUrl().length > 0
  );
}

export function isAllowlistedGithubLogin(login: string): boolean {
  return adminGithubAllowlist().has(login.trim().toLowerCase());
}
