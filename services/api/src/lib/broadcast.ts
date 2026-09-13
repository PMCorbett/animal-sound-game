import {
  ApiGatewayManagementApiClient,
  GoneException,
  PostToConnectionCommand,
} from "@aws-sdk/client-apigatewaymanagementapi";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import type { LeaderboardEntry } from "../types.js";
import { CONNECTION_PARTITION_KEY } from "./connections.js";

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));

function tableName(): string {
  const name = process.env.SCORES_TABLE_NAME;
  if (!name) {
    throw new Error("SCORES_TABLE_NAME is not configured");
  }
  return name;
}

function managementEndpoint(): string | undefined {
  return process.env.WEBSOCKET_API_ENDPOINT;
}

function managementClient(): ApiGatewayManagementApiClient | null {
  const endpoint = managementEndpoint();
  if (!endpoint) {
    return null;
  }
  return new ApiGatewayManagementApiClient({ endpoint });
}

export async function listConnectionIds(): Promise<string[]> {
  const result = await dynamo.send(
    new QueryCommand({
      TableName: tableName(),
      KeyConditionExpression: "pk = :pk",
      ExpressionAttributeValues: {
        ":pk": CONNECTION_PARTITION_KEY,
      },
    }),
  );

  return (result.Items ?? [])
    .map((item) => item.sk)
    .filter((sk): sk is string => typeof sk === "string");
}

export async function deleteConnection(connectionId: string): Promise<void> {
  await dynamo.send(
    new DeleteCommand({
      TableName: tableName(),
      Key: {
        pk: CONNECTION_PARTITION_KEY,
        sk: connectionId,
      },
    }),
  );
}

export function buildScoreSubmittedEvent(entry: LeaderboardEntry): string {
  return JSON.stringify({
    type: "score_submitted",
    entry,
  });
}

export async function broadcastScoreSubmitted(
  entry: LeaderboardEntry,
): Promise<void> {
  const client = managementClient();
  if (!client) {
    return;
  }

  const payload = buildScoreSubmittedEvent(entry);
  const connectionIds = await listConnectionIds();

  for (const connectionId of connectionIds) {
    try {
      await client.send(
        new PostToConnectionCommand({
          ConnectionId: connectionId,
          Data: Buffer.from(payload),
        }),
      );
    } catch (error) {
      if (error instanceof GoneException) {
        await deleteConnection(connectionId).catch(() => undefined);
        continue;
      }
      console.error("Failed to broadcast to connection", connectionId, error);
    }
  }
}
