import { afterEach, describe, expect, it } from "vitest";
import { createSessionToken, verifySessionToken } from "./session.js";

describe("admin session JWT", () => {
  afterEach(() => {
    delete process.env.SESSION_SECRET;
    delete process.env.ADMIN_GITHUB_ALLOWLIST;
  });

  it("round-trips a valid session", () => {
    process.env.SESSION_SECRET = "test-secret-key-for-jwt-signing";
    process.env.ADMIN_GITHUB_ALLOWLIST = "PMCorbett";

    const token = createSessionToken({ sub: "123", login: "PMCorbett" });
    const session = verifySessionToken(token);

    expect(session).toEqual({ sub: "123", login: "PMCorbett" });
  });

  it("rejects tampered tokens", () => {
    process.env.SESSION_SECRET = "test-secret-key-for-jwt-signing";
    process.env.ADMIN_GITHUB_ALLOWLIST = "PMCorbett";

    const token = createSessionToken({ sub: "123", login: "PMCorbett" });
    const session = verifySessionToken(`${token}x`);

    expect(session).toBeNull();
  });

  it("rejects logins not on the allowlist", () => {
    process.env.SESSION_SECRET = "test-secret-key-for-jwt-signing";
    process.env.ADMIN_GITHUB_ALLOWLIST = "PMCorbett";

    const token = createSessionToken({ sub: "123", login: "OtherUser" });
    expect(verifySessionToken(token)).toBeNull();
  });
});
