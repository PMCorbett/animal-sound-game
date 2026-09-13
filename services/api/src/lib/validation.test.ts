import { describe, expect, it } from "vitest";
import { isBlockedNickname } from "./blocklist.js";
import {
  buildScoreRecord,
  hourBucket,
  scoreSortKey,
} from "./scores.js";
import {
  parseLeaderboardQuery,
  parseSubmitBody,
  ValidationError,
} from "./validation.js";

describe("parseSubmitBody", () => {
  it("accepts valid payloads", () => {
    expect(
      parseSubmitBody({
        nickname: "MooMaster",
        animal: "cow",
        score: 87.4,
        mode: "child",
      }),
    ).toEqual({
      nickname: "MooMaster",
      animal: "cow",
      score: 87,
      mode: "child",
    });
  });

  it("rejects invalid animals", () => {
    expect(() =>
      parseSubmitBody({
        nickname: "Test",
        animal: "lion",
        score: 50,
        mode: "child",
      }),
    ).toThrow(ValidationError);
  });

  it("rejects out-of-range scores", () => {
    expect(() =>
      parseSubmitBody({
        nickname: "Test",
        animal: "cow",
        score: 101,
        mode: "child",
      }),
    ).toThrow(ValidationError);
  });
});

describe("parseLeaderboardQuery", () => {
  it("defaults limit to 20", () => {
    expect(parseLeaderboardQuery({})).toEqual({ limit: 20 });
  });

  it("parses filters", () => {
    expect(
      parseLeaderboardQuery({ animal: "duck", mode: "grownup", limit: "5" }),
    ).toEqual({ animal: "duck", mode: "grownup", limit: 5 });
  });
});

describe("blocklist", () => {
  it("blocks offensive nicknames", () => {
    expect(isBlockedNickname("shithead")).toBe(true);
    expect(isBlockedNickname("BaaBaa")).toBe(false);
  });
});

describe("score keys", () => {
  it("zero-pads scores for descending sort", () => {
    expect(scoreSortKey(42, "2026-09-12T14:30:00.000Z")).toBe(
      "SCORE#00000042#2026-09-12T14:30:00.000Z",
    );
    expect(scoreSortKey(99, "2026-09-12T14:30:00.000Z")).toBe(
      "SCORE#00000099#2026-09-12T14:30:00.000Z",
    );
    expect(
      scoreSortKey(99, "2026-09-12T14:30:00.000Z") >
        scoreSortKey(42, "2026-09-12T14:30:00.000Z"),
    ).toBe(true);
  });

  it("builds records with ttl", () => {
    const now = new Date("2026-09-12T14:30:00.000Z");
    const record = buildScoreRecord(
      { nickname: "Kid", animal: "cat", score: 80, mode: "child" },
      now,
    );
    expect(record.pk).toBe("ANIMAL#cat");
    expect(record.ttl).toBeGreaterThan(Math.floor(now.getTime() / 1000));
    expect(hourBucket(now)).toBe("2026-09-12T14");
  });
});
