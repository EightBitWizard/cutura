import { describe, expect, it } from "vitest";

import { safePath } from "./http";

describe("safePath", () => {
  it("allows local relative paths", () => {
    expect(safePath("/fabrics")).toBe("/fabrics");
    expect(safePath("/")).toBe("/");
    expect(safePath("/a/b?x=1")).toBe("/a/b?x=1");
  });

  it("rejects absolute and protocol-relative URLs (open-redirect guard)", () => {
    expect(safePath("https://evil.com")).toBe("/");
    expect(safePath("http://evil.com")).toBe("/");
    expect(safePath("//evil.com")).toBe("/");
    expect(safePath("/\\evil.com")).toBe("/");
  });

  it("rejects non-paths and uses the fallback", () => {
    expect(safePath("fabrics")).toBe("/");
    expect(safePath(null)).toBe("/");
    expect(safePath("bad", "/dashboard")).toBe("/dashboard");
  });
});
