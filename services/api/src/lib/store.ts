import {
  DynamoDBClient,
  ConditionalCheckFailedException,
} from "@aws-sdk/client-dynamodb";
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import type { AnimalId, LeaderboardEntry, PlayerMode, SubmitScoreBody } from "../types.js";
import { isBlockedNickname } from "./blocklist.js";
import {
  RATE_LIMIT_PER_HOUR,
  animalPartitionKey,
  buildScoreRecord,
  globalPartitionKey,
  hourBucket,
  matchesModeFilter,
  ratePartitionKey,
  rateSortKey,
  recordToEntry,
} from "./scores.js";
import { broadcastScoreSubmitted } from "./broadcast.js";
import { ValidationError } from "./validation.js";

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));

function tableName(): string {
  const name = process.env.SCORES_TABLE_NAME;
  if (!name) {
    throw new Error("SCORES_TABLE_NAME is not configured");
  }
  return name;
}

export async function getLeaderboard(options: {
  animal?: AnimalId;
  mode?: PlayerMode;
  limit: number;
}): Promise<LeaderboardEntry[]> {
  const pk = options.animal ? animalPartitionKey(options.animal) : globalPartitionKey();
  const fetchLimit = Math.min(options.limit * 5, 100);

  const result = await client.send(
    new QueryCommand({
      TableName: tableName(),
      KeyConditionExpression: "pk = :pk AND begins_with(sk, :prefix)",
      ExpressionAttributeValues: {
        ":pk": pk,
        ":prefix": "SCORE#",
      },
      ScanIndexForward: false,
      Limit: fetchLimit,
    }),
  );

  const entries = (result.Items ?? [])
    .filter((item) => matchesModeFilter(item as Parameters<typeof matchesModeFilter>[0], options.mode))
    .slice(0, options.limit)
    .map((item) => recordToEntry(item as Parameters<typeof recordToEntry>[0]));

  return entries;
}

async function countRecentSubmissions(
  animal: AnimalId,
  nickname: string,
  now: Date,
): Promise<number> {
  const bucket = hourBucket(now);
  const result = await client.send(
    new QueryCommand({
      TableName: tableName(),
      KeyConditionExpression: "pk = :pk AND sk = :sk",
      ExpressionAttributeValues: {
        ":pk": ratePartitionKey(animal, nickname),
        ":sk": rateSortKey(bucket),
      },
    }),
  );

  const item = result.Items?.[0];
  return typeof item?.count === "number" ? item.count : 0;
}

export async function submitScore(body: SubmitScoreBody): Promise<LeaderboardEntry> {
  if (isBlockedNickname(body.nickname)) {
    throw new ValidationError("That nickname is not allowed");
  }

  const now = new Date();
  const recentCount = await countRecentSubmissions(body.animal, body.nickname, now);
  if (recentCount >= RATE_LIMIT_PER_HOUR) {
    throw new ValidationError(
      "Too many submissions for this nickname — try again in an hour",
    );
  }

  const record = buildScoreRecord(body, now);
  const globalRecord = { ...record, pk: globalPartitionKey() };

  await client.send(
    new PutCommand({
      TableName: tableName(),
      Item: record,
    }),
  );

  await client.send(
    new PutCommand({
      TableName: tableName(),
      Item: globalRecord,
    }),
  );

  const bucket = hourBucket(now);
  try {
    await client.send(
      new PutCommand({
        TableName: tableName(),
        Item: {
          pk: ratePartitionKey(body.animal, body.nickname),
          sk: rateSortKey(bucket),
          count: recentCount + 1,
          ttl: Math.floor(now.getTime() / 1000) + 2 * 60 * 60,
        },
        ConditionExpression: "attribute_not_exists(#c) OR #c = :prev",
        ExpressionAttributeNames: { "#c": "count" },
        ExpressionAttributeValues: { ":prev": recentCount },
      }),
    );
  } catch (error) {
    if (!(error instanceof ConditionalCheckFailedException)) {
      throw error;
    }
  }

  const entry = recordToEntry(record);

  try {
    await broadcastScoreSubmitted(entry);
  } catch (error) {
    console.error("Leaderboard broadcast failed", error);
  }

  return entry;
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

async function scoreItemExists(pk: string, sk: string): Promise<boolean> {
  const result = await client.send(
    new QueryCommand({
      TableName: tableName(),
      KeyConditionExpression: "pk = :pk AND sk = :sk",
      ExpressionAttributeValues: { ":pk": pk, ":sk": sk },
      Limit: 1,
    }),
  );
  return (result.Items?.length ?? 0) > 0;
}

export async function deleteScore(animal: AnimalId, sk: string): Promise<void> {
  const animalPk = animalPartitionKey(animal);
  const globalPk = globalPartitionKey();

  const exists = await scoreItemExists(animalPk, sk);
  if (!exists) {
    throw new NotFoundError("Score not found");
  }

  await client.send(
    new DeleteCommand({
      TableName: tableName(),
      Key: { pk: animalPk, sk },
    }),
  );

  await client.send(
    new DeleteCommand({
      TableName: tableName(),
      Key: { pk: globalPk, sk },
    }),
  );
}

export async function updateScoreNickname(
  animal: AnimalId,
  sk: string,
  nickname: string,
): Promise<LeaderboardEntry> {
  if (isBlockedNickname(nickname)) {
    throw new ValidationError("That nickname is not allowed");
  }

  const animalPk = animalPartitionKey(animal);
  const globalPk = globalPartitionKey();

  const exists = await scoreItemExists(animalPk, sk);
  if (!exists) {
    throw new NotFoundError("Score not found");
  }

  const updateParams = {
    TableName: tableName(),
    Key: { pk: animalPk, sk },
    UpdateExpression: "SET nickname = :nickname",
    ExpressionAttributeValues: { ":nickname": nickname },
    ReturnValues: "ALL_NEW" as const,
  };

  const animalResult = await client.send(new UpdateCommand(updateParams));

  await client.send(
    new UpdateCommand({
      ...updateParams,
      Key: { pk: globalPk, sk },
    }),
  );

  return recordToEntry(
    animalResult.Attributes as Parameters<typeof recordToEntry>[0],
  );
}
