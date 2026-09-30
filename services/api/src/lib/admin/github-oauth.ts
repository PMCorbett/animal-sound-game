import { randomBytes } from "node:crypto";
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import {
  OAUTH_STATE_TTL_SECONDS,
  SESSION_TTL_SECONDS,
  adminOAuthRedirectUri,
  githubClientId,
  isAdminAuthConfigured,
  isAllowlistedGithubLogin,
  webAdminSuccessUrl,
} from "./config.js";
import { loadAdminAuthSecrets } from "./secrets.js";
import {
  clearOAuthStateCookie,
  clearSessionCookie,
  createSessionToken,
  oauthStateCookie,
  readOAuthStateFromEvent,
  readSessionFromEvent,
  sessionCookie,
} from "./session.js";
import { checkOAuthRateLimit } from "./oauth-rate-limit.js";

function redirect(location: string, cookies: string[] = []): APIGatewayProxyResultV2 {
  return {
    statusCode: 302,
    headers: { Location: location },
    cookies,
    body: "",
  };
}

function adminErrorRedirect(code: string): APIGatewayProxyResultV2 {
  const base = webAdminSuccessUrl();
  const url = `${base}${base.includes("?") ? "&" : "?"}error=${encodeURIComponent(code)}`;
  return redirect(url, [clearOAuthStateCookie()]);
}

export async function handleGithubAuthStart(
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> {
  if (!(await isAdminAuthConfigured())) {
    return {
      statusCode: 503,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Admin authentication is not configured" }),
    };
  }

  const sourceIp = event.requestContext.http.sourceIp ?? "unknown";
  const allowed = await checkOAuthRateLimit(sourceIp);
  if (!allowed) {
    return {
      statusCode: 429,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Too many login attempts — try again later" }),
    };
  }

  const state = randomBytes(24).toString("hex");
  const params = new URLSearchParams({
    client_id: githubClientId(),
    redirect_uri: adminOAuthRedirectUri(),
    scope: "read:user",
    state,
  });

  return redirect(
    `https://github.com/login/oauth/authorize?${params.toString()}`,
    [oauthStateCookie(state, OAUTH_STATE_TTL_SECONDS)],
  );
}

interface GithubTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

interface GithubUser {
  id: number;
  login: string;
}

async function exchangeCodeForToken(code: string): Promise<string | null> {
  const { githubClientSecret } = await loadAdminAuthSecrets();
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: githubClientId(),
      client_secret: githubClientSecret,
      code,
      redirect_uri: adminOAuthRedirectUri(),
    }),
  });

  const body = (await response.json()) as GithubTokenResponse;
  if (!response.ok || !body.access_token) {
    console.warn(
      JSON.stringify({
        type: "admin_oauth_token_error",
        status: response.status,
        error: body.error ?? "unknown",
        errorDescription: body.error_description ?? null,
      }),
    );
    return null;
  }

  return body.access_token;
}

async function fetchGithubUser(accessToken: string): Promise<GithubUser | null> {
  const response = await fetch("https://api.github.com/user", {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": "animal-sound-game-admin",
    },
  });

  if (!response.ok) {
    console.warn(
      JSON.stringify({
        type: "admin_oauth_user_error",
        status: response.status,
      }),
    );
    return null;
  }

  return (await response.json()) as GithubUser;
}

export async function handleGithubAuthCallback(
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> {
  if (!(await isAdminAuthConfigured())) {
    return adminErrorRedirect("not_configured");
  }

  const params = event.queryStringParameters ?? {};
  const code = params.code;
  const state = params.state;

  if (!code || !state) {
    const githubError = params.error;
    if (githubError) {
      console.warn(
        JSON.stringify({
          type: "admin_oauth_github_error",
          error: githubError,
          description: params.error_description ?? null,
        }),
      );
    }
    return adminErrorRedirect("oauth_failed");
  }

  const expectedState = readOAuthStateFromEvent(event);
  if (!expectedState || expectedState !== state) {
    return adminErrorRedirect("oauth_state");
  }

  const sourceIp = event.requestContext.http.sourceIp ?? "unknown";
  const allowed = await checkOAuthRateLimit(sourceIp);
  if (!allowed) {
    return adminErrorRedirect("rate_limited");
  }

  const accessToken = await exchangeCodeForToken(code);
  if (!accessToken) {
    return adminErrorRedirect("oauth_failed");
  }

  const user = await fetchGithubUser(accessToken);
  if (!user?.login) {
    return adminErrorRedirect("oauth_failed");
  }

  if (!isAllowlistedGithubLogin(user.login)) {
    console.warn(
      JSON.stringify({
        type: "admin_login_denied",
        githubLogin: user.login,
        timestamp: new Date().toISOString(),
      }),
    );
    return adminErrorRedirect("not_allowed");
  }

  const token = await createSessionToken({
    sub: String(user.id),
    login: user.login,
  });

  return redirect(webAdminSuccessUrl(), [
    clearOAuthStateCookie(),
    sessionCookie(token, SESSION_TTL_SECONDS),
  ]);
}

export function handleAdminLogout(): APIGatewayProxyResultV2 {
  return {
    statusCode: 204,
    cookies: [clearSessionCookie()],
    body: "",
  };
}

export async function handleAdminSession(
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> {
  const session = await readSessionFromEvent(event);
  if (!session) {
    return {
      statusCode: 401,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Not authenticated" }),
    };
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ authenticated: true, login: session.login }),
  };
}
