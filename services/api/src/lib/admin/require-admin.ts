import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { readSessionFromEvent, type AdminSession } from "./session.js";

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ForbiddenError";
  }
}

const CSRF_HEADER = "xmlhttprequest";

export function requireAdmin(event: APIGatewayProxyEventV2): AdminSession {
  const session = readSessionFromEvent(event);
  if (!session) {
    throw new AuthError("Authentication required");
  }

  const method = event.requestContext.http.method;
  if (method === "DELETE" || method === "PATCH" || method === "POST") {
    const path = event.rawPath;
    if (path.startsWith("/admin/")) {
      const csrf =
        event.headers["x-requested-with"] ??
        event.headers["X-Requested-With"];
      if (typeof csrf !== "string" || csrf.toLowerCase() !== CSRF_HEADER) {
        throw new AuthError("Invalid request");
      }
    }
  }

  return session;
}
