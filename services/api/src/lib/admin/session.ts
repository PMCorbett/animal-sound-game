import { createHmac, timingSafeEqual } from "node:crypto";
import type { APIGatewayProxyEventV2 } from "aws-lambda";
import {
  OAUTH_STATE_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS,
  isAllowlistedGithubLogin,
} from "./config.js";
import { loadAdminAuthSecrets } from "./secrets.js";

export interface AdminSession {
  sub: string;
  login: string;
}

function base64urlEncode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function signSegment(data: string, secret: string): string {
  return createHmac("sha256", secret).update(data).digest("base64url");
}

export async function createSessionToken(session: AdminSession): Promise<string> {
  const { sessionSecret } = await loadAdminAuthSecrets();
  if (!sessionSecret) {
    throw new Error("SESSION_SECRET is not configured");
  }

  const header = base64urlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const now = Math.floor(Date.now() / 1000);
  const payload = base64urlEncode(
    JSON.stringify({
      sub: session.sub,
      login: session.login,
      iat: now,
      exp: now + SESSION_TTL_SECONDS,
    }),
  );
  const signature = signSegment(`${header}.${payload}`, sessionSecret);
  return `${header}.${payload}.${signature}`;
}

export async function verifySessionToken(
  token: string,
): Promise<AdminSession | null> {
  const { sessionSecret } = await loadAdminAuthSecrets();
  if (!sessionSecret) {
    return null;
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }

  const [header, payload, signature] = parts;
  const expected = signSegment(`${header}.${payload}`, sessionSecret);
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const body = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as {
      sub?: string;
      login?: string;
      exp?: number;
    };
    if (
      typeof body.sub !== "string" ||
      typeof body.login !== "string" ||
      typeof body.exp !== "number"
    ) {
      return null;
    }
    if (body.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    if (!isAllowlistedGithubLogin(body.login)) {
      return null;
    }
    return { sub: body.sub, login: body.login };
  } catch {
    return null;
  }
}

export function parseCookieHeader(
  cookies: string[] | undefined,
): Record<string, string> {
  const result: Record<string, string> = {};
  if (!cookies) {
    return result;
  }

  for (const cookie of cookies) {
    const segments = cookie.split(";");
    for (const segment of segments) {
      const trimmed = segment.trim();
      const eq = trimmed.indexOf("=");
      if (eq === -1) {
        continue;
      }
      const name = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (name && !(name in result)) {
        result[name] = decodeURIComponent(value);
      }
    }
  }

  return result;
}

export async function readSessionFromEvent(
  event: APIGatewayProxyEventV2,
): Promise<AdminSession | null> {
  const cookies = parseCookieHeader(event.cookies);
  const token = cookies[SESSION_COOKIE_NAME];
  if (!token) {
    return null;
  }
  return verifySessionToken(token);
}

export function sessionCookie(token: string, maxAgeSeconds: number): string {
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=${maxAgeSeconds}`;
}

export function clearSessionCookie(): string {
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=0`;
}

export function oauthStateCookie(state: string, maxAgeSeconds: number): string {
  return `${OAUTH_STATE_COOKIE_NAME}=${encodeURIComponent(state)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAgeSeconds}`;
}

export function clearOAuthStateCookie(): string {
  return `${OAUTH_STATE_COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export function readOAuthStateFromEvent(
  event: APIGatewayProxyEventV2,
): string | null {
  const cookies = parseCookieHeader(event.cookies);
  const state = cookies[OAUTH_STATE_COOKIE_NAME];
  return state ?? null;
}
