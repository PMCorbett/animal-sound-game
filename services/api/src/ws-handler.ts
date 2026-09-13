import type {
  APIGatewayProxyResultV2,
  APIGatewayProxyWebsocketEventV2,
} from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  CONNECTION_PARTITION_KEY,
  CONNECTION_TTL_SECONDS,
} from "./lib/connections.js";

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));

function tableName(): string {
  const name = process.env.SCORES_TABLE_NAME;
  if (!name) {
    throw new Error("SCORES_TABLE_NAME is not configured");
  }
  return name;
}

export async function handler(
  event: APIGatewayProxyWebsocketEventV2,
): Promise<APIGatewayProxyResultV2> {
  const routeKey = event.requestContext.routeKey;
  const connectionId = event.requestContext.connectionId;

  if (routeKey === "$connect") {
    const now = Math.floor(Date.now() / 1000);
    await client.send(
      new PutCommand({
        TableName: tableName(),
        Item: {
          pk: CONNECTION_PARTITION_KEY,
          sk: connectionId,
          ttl: now + CONNECTION_TTL_SECONDS,
        },
      }),
    );
    return { statusCode: 200, body: "Connected" };
  }

  if (routeKey === "$disconnect") {
    await client.send(
      new DeleteCommand({
        TableName: tableName(),
        Key: {
          pk: CONNECTION_PARTITION_KEY,
          sk: connectionId,
        },
      }),
    );
    return { statusCode: 200, body: "Disconnected" };
  }

  return { statusCode: 200, body: "OK" };
}
