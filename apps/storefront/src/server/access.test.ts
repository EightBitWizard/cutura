import { describe, expect, it } from "vitest";

import { checkSitePassword, hasSiteAccess, signSiteAccess } from "./access";

describe("site access gate", () => {
  it("checkSitePassword accepts the exact password and rejects others (constant time)", () => {
    expect(checkSitePassword("s3cret", "s3cret")).toBe(true);
    expect(checkSitePassword("nope", "s3cret")).toBe(false);
    expect(checkSitePassword("", "s3cret")).toBe(false);
    expect(checkSitePassword("s3cret", "")).toBe(false);
  });

  it("signs a cookie token that verifies against the same password", async () => {
    const token = await signSiteAccess("s3cret");
    expect(await hasSiteAccess(token, "s3cret")).toBe(true);
  });

  it("rejects a token signed with a different password", async () => {
    const token = await signSiteAccess("s3cret");
    expect(await hasSiteAccess(token, "other-password")).toBe(false);
  });

  it("rejects a missing or malformed token", async () => {
    expect(await hasSiteAccess(null, "s3cret")).toBe(false);
    expect(await hasSiteAccess(undefined, "s3cret")).toBe(false);
    expect(await hasSiteAccess("garbage", "s3cret")).toBe(false);
  });
});
