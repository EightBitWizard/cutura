import { describe, expect, it } from "vitest";

import { buttonClasses } from "./buttonClasses";

describe("buttonClasses", () => {
  it("defaults to a primary medium button (ink fill, paper text)", () => {
    const cls = buttonClasses();
    expect(cls).toContain("bg-ink");
    expect(cls).toContain("text-paper");
  });

  it("applies the secondary variant outline", () => {
    expect(buttonClasses("secondary")).toContain("border-line-strong");
  });

  it("applies the requested size", () => {
    expect(buttonClasses("primary", "lg")).toContain("py-3");
  });

  it("always includes a visible focus ring for accessibility", () => {
    expect(buttonClasses()).toContain("focus-visible:ring-accent");
    expect(buttonClasses("ghost", "sm")).toContain("focus-visible:ring-accent");
  });

  it("appends extra classes last", () => {
    const cls = buttonClasses("ghost", "sm", "w-full");
    expect(cls).toContain("w-full");
    expect(cls.trim().endsWith("w-full")).toBe(true);
  });
});
