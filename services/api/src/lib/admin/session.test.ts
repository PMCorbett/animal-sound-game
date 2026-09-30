import { afterEach, describe, expect, it } from "vitest";
import { clearAdminAuthSecretsCache } from "./secrets.js";
import { createSessionToken, verifySessionToken } from "./session.js";

describe("admin session JWT", () => {
  afterEach(() => {
    delete process.env.SESSION_SECRET;
    delete process.env.ADMIN_GITHUB_ALLOWLIST;
    delete process.env.ADMIN_AUTH_SECRET_ARN;
    clearAdminAuthSecretsCache();
  });

  it("round-trips a valid session", async () => {
    process.env.SESSION_SECRET = "test-secret-key-for-jwt-signing";
    process.env.ADMIN_GITHUB_ALLOWLIST = "PMCorbett";

    const token = await createSessionToken({ sub: "123", login: "PMCorbett" });
    const session = await verifySessionToken(token);

    expect(session).toEqual({ sub: "123", login: "PMCorbett" });
  });

  it("rejects tampered tokens", async () => {
    process.env.SESSION_SECRET = "test-secret-key-for-jwt-signing";
    process.env.ADMIN_GITHUB_ALLOWLIST = "PMCorbett";

    const token = await createSessionToken({ sub: "123", login: "PMCorbett" });
    const session = await verifySessionToken(`${token}x`);

    expect(session).toBeNull();
  });

  it("rejects logins not on the allowlist", async () => {
    process.env.SESSION_SECRET = "test-secret-key-for-jwt-signing";
    process.env.ADMIN_GITHUB_ALLOWLIST = "PMCorbett";

    const token = await createSessionToken({ sub: "123", login: "OtherUser" });
    expect(await verifySessionToken(token)).toBeNull();
  });
});
