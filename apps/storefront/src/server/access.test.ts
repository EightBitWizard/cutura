import { describe, expect, it } from "vitest";

import { verifyBasicAuth } from "./access";

const header = (user: string, pass: string) => `Basic ${btoa(`${user}:${pass}`)}`;

describe("verifyBasicAuth", () => {
  it("accepts the correct password (username ignored)", () => {
    expect(verifyBasicAuth(header("cutura", "s3cret"), "s3cret")).toBe(true);
    expect(verifyBasicAuth(header("anyone", "s3cret"), "s3cret")).toBe(true);
  });

  it("rejects a wrong password", () => {
    expect(verifyBasicAuth(header("cutura", "nope"), "s3cret")).toBe(false);
  });

  it("rejects a missing or non-Basic header", () => {
    expect(verifyBasicAuth(null, "s3cret")).toBe(false);
    expect(verifyBasicAuth("Bearer xyz", "s3cret")).toBe(false);
    expect(verifyBasicAuth("", "s3cret")).toBe(false);
  });

  it("rejects malformed base64 or a missing colon", () => {
    expect(verifyBasicAuth("Basic !!!not-base64!!!", "s3cret")).toBe(false);
    expect(verifyBasicAuth(`Basic ${btoa("nocolon")}`, "s3cret")).toBe(false);
  });

  it("rejects when no password is configured", () => {
    expect(verifyBasicAuth(header("cutura", ""), "")).toBe(false);
  });
});
