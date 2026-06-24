import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";

import { getDb } from "../getDb";
import { order } from "../schema";
import { exportOrdersCsv } from "./export";

const db = () => getDb(env.TARGET_TEST_DB);
const iso = "2026-07-05T10:00:00.000Z";

describe("exportOrdersCsv", () => {
  it("emits a header + rows and escapes special characters", async () => {
    const id = crypto.randomUUID();
    await db().insert(order).values({
      id,
      orderNumber: 'CUT-"X,1"', // contains a quote + comma -> must be escaped
      totalMinor: 12900,
      acceptedTermsVersion: "v1",
      acceptedPrivacyVersion: "v1",
      status: "shipped",
      createdAt: iso,
      updatedAt: iso,
    });
    const csv = await exportOrdersCsv(db());
    const lines = csv.split("\r\n");
    expect(lines[0]).toBe(
      "order_number,status,currency,total_minor,fabric_minor,production_minor,inbound_minor,fees_minor,margin_minor,created_at",
    );
    // The escaped order number: internal quotes doubled, whole field quoted.
    expect(csv).toContain('"CUT-""X,1"""');
    // No measurement columns are present.
    expect(lines[0]).not.toContain("chest");
  });
});
