import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from "aws-lambda";
import { getLeaderboard, submitScore } from "./lib/store.js";
import { parseLeaderboardQuery, parseSubmitBody, ValidationError } from "./lib/validation.js";

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

    return response(404, { error: "Not found" });
  } catch (error) {
    if (error instanceof ValidationError) {
      return response(400, { error: error.message });
    }

    if (error instanceof SyntaxError) {
      return response(400, { error: "Invalid JSON body" });
    }

    console.error(error);
    return response(500, { error: "Internal server error" });
  }
}
