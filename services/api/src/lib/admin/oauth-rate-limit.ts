import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { hourBucket, rateSortKey } from "../scores.js";

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const OAUTH_STARTS_PER_HOUR = 30;

function tableName(): string | null {
  const name = process.env.SCORES_TABLE_NAME;
  return name ?? null;
}

function oauthRatePartitionKey(sourceIp: string): string {
  return `OAUTH#RATE#${sourceIp}`;
}

export async function checkOAuthRateLimit(sourceIp: string): Promise<boolean> {
  const table = tableName();
  if (!table) {
    return true;
  }

  const now = new Date();
  const bucket = hourBucket(now);
  const pk = oauthRatePartitionKey(sourceIp);
  const sk = rateSortKey(bucket);

  const existing = await client.send(
    new QueryCommand({
      TableName: table,
      KeyConditionExpression: "pk = :pk AND sk = :sk",
      ExpressionAttributeValues: { ":pk": pk, ":sk": sk },
    }),
  );

  const count =
    typeof existing.Items?.[0]?.count === "number"
      ? existing.Items[0].count
      : 0;

  if (count >= OAUTH_STARTS_PER_HOUR) {
    return false;
  }

  await client.send(
    new PutCommand({
      TableName: table,
      Item: {
        pk,
        sk,
        count: count + 1,
        ttl: Math.floor(now.getTime() / 1000) + 2 * 60 * 60,
      },
    }),
  );

  return true;
}
