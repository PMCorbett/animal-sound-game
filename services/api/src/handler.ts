import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from "aws-lambda";
import { logAdminAction } from "./lib/admin/audit.js";
import {
  handleAdminLogout,
  handleAdminSession,
  handleGithubAuthCallback,
  handleGithubAuthStart,
} from "./lib/admin/github-oauth.js";
import { AuthError, requireAdmin } from "./lib/admin/require-admin.js";
import {
  deleteScore,
  getLeaderboard,
  NotFoundError,
  submitScore,
  updateScoreNickname,
} from "./lib/store.js";
import {
  parseAdminNicknameUpdate,
  parseAdminScoreRef,
  parseLeaderboardQuery,
  parseSubmitBody,
  ValidationError,
} from "./lib/validation.js";

const JSON_HEADERS = {
  "Content-Type": "application/json",
};

function response(statusCode: number, body: unknown): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  };
}

export async function handler(
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> {
  const method = event.requestContext.http.method;
  const path = event.rawPath;

  try {
    if (method === "GET" && path === "/leaderboard") {
      const query = parseLeaderboardQuery(event.queryStringParameters ?? {});
      const entries = await getLeaderboard(query);
      return response(200, { entries });
    }

    if (method === "POST" && path === "/scores") {
      const raw = event.body ? JSON.parse(event.body) : null;
      const body = parseSubmitBody(raw);
      const entry = await submitScore(body);
      return response(201, { entry });
    }

    if (method === "GET" && path === "/admin/auth/github") {
      return handleGithubAuthStart(event);
    }

    if (method === "GET" && path === "/admin/auth/callback") {
      return handleGithubAuthCallback(event);
    }

    if (method === "GET" && path === "/admin/session") {
      return handleAdminSession(event);
    }

    if (method === "POST" && path === "/admin/logout") {
      await requireAdmin(event);
      return handleAdminLogout();
    }

    if (method === "GET" && path === "/admin/leaderboard") {
      const admin = await requireAdmin(event);
      const query = parseLeaderboardQuery(event.queryStringParameters ?? {});
      const entries = await getLeaderboard(query);
      logAdminAction("list_leaderboard", { githubLogin: admin.login });
      return response(200, { entries });
    }

    if (method === "DELETE" && path === "/admin/scores") {
      const admin = await requireAdmin(event);
      const raw = event.body ? JSON.parse(event.body) : null;
      const ref = parseAdminScoreRef(raw);
      await deleteScore(ref.animal, ref.id);
      logAdminAction("delete_score", {
        githubLogin: admin.login,
        id: ref.id,
        animal: ref.animal,
      });
      return { statusCode: 204, body: "" };
    }

    if (method === "PATCH" && path === "/admin/scores") {
      const admin = await requireAdmin(event);
      const raw = event.body ? JSON.parse(event.body) : null;
      const body = parseAdminNicknameUpdate(raw);
      const entry = await updateScoreNickname(body.animal, body.id, body.nickname);
      logAdminAction("update_nickname", {
        githubLogin: admin.login,
        id: body.id,
        animal: body.animal,
        nickname: body.nickname,
      });
      return response(200, { entry });
    }

    return response(404, { error: "Not found" });
  } catch (error) {
    if (error instanceof ValidationError) {
      return response(400, { error: error.message });
    }

    if (error instanceof AuthError) {
      return response(401, { error: error.message });
    }

    if (error instanceof NotFoundError) {
      return response(404, { error: error.message });
    }

    if (error instanceof SyntaxError) {
      return response(400, { error: "Invalid JSON body" });
    }

    console.error(error);
    return response(500, { error: "Internal server error" });
  }
}
