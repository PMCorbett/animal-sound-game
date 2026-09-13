import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LeaderboardEntry } from "../types.js";

const sendMock = vi.fn();
const querySendMock = vi.fn();
const deleteSendMock = vi.fn();

vi.mock("@aws-sdk/client-apigatewaymanagementapi", () => ({
  ApiGatewayManagementApiClient: vi.fn(() => ({ send: sendMock })),
  PostToConnectionCommand: vi.fn((input) => input),
  GoneException: class GoneException extends Error {
    name = "GoneException";
  },
}));

vi.mock("@aws-sdk/client-dynamodb", () => ({
  DynamoDBClient: vi.fn(),
}));

vi.mock("@aws-sdk/lib-dynamodb", () => ({
  DynamoDBDocumentClient: {
    from: vi.fn(() => ({
      send: (command: { constructor?: { name: string } }) => {
        if (command.constructor?.name === "QueryCommand") {
          return querySendMock(command);
        }
        if (command.constructor?.name === "DeleteCommand") {
          return deleteSendMock(command);
        }
        return Promise.resolve({});
      },
    })),
  },
  QueryCommand: class QueryCommand {
    constructor(public input: unknown) {}
  },
  DeleteCommand: class DeleteCommand {
    constructor(public input: unknown) {}
  },
}));

const entry: LeaderboardEntry = {
  id: "SCORE#00000087#2026-01-01T00:00:00.000Z",
  nickname: "Alex",
  animal: "cow",
  score: 87,
  mode: "child",
  submittedAt: "2026-01-01T00:00:00.000Z",
};

describe("broadcastScoreSubmitted", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SCORES_TABLE_NAME = "test-table";
    process.env.WEBSOCKET_API_ENDPOINT =
      "https://abc123.execute-api.eu-west-2.amazonaws.com/prod";
    querySendMock.mockResolvedValue({
      Items: [{ sk: "conn-1" }, { sk: "conn-2" }],
    });
    sendMock.mockResolvedValue({});
    deleteSendMock.mockResolvedValue({});
  });

  it("posts score_submitted to all connections", async () => {
    const { broadcastScoreSubmitted, buildScoreSubmittedEvent } =
      await import("./broadcast.js");

    await broadcastScoreSubmitted(entry);

    expect(sendMock).toHaveBeenCalledTimes(2);
    expect(sendMock).toHaveBeenCalledWith({
      ConnectionId: "conn-1",
      Data: Buffer.from(buildScoreSubmittedEvent(entry)),
    });
    expect(sendMock).toHaveBeenCalledWith({
      ConnectionId: "conn-2",
      Data: Buffer.from(buildScoreSubmittedEvent(entry)),
    });
  });

  it("deletes stale connections on GoneException", async () => {
    const { GoneException } = await import(
      "@aws-sdk/client-apigatewaymanagementapi"
    );
    const { broadcastScoreSubmitted } = await import("./broadcast.js");

    sendMock
      .mockRejectedValueOnce(new GoneException({ message: "gone", $metadata: {} }))
      .mockResolvedValueOnce({});

    await broadcastScoreSubmitted(entry);

    expect(deleteSendMock).toHaveBeenCalledTimes(1);
    expect(sendMock).toHaveBeenCalledTimes(2);
  });

  it("no-ops when WEBSOCKET_API_ENDPOINT is unset", async () => {
    delete process.env.WEBSOCKET_API_ENDPOINT;
    const { broadcastScoreSubmitted } = await import("./broadcast.js");

    await broadcastScoreSubmitted(entry);

    expect(querySendMock).not.toHaveBeenCalled();
    expect(sendMock).not.toHaveBeenCalled();
  });
});
