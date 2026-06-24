import { describe, expect, it } from "vitest";

import { CUSTOMER_MILESTONES, customerMilestone } from "./customerStatusTimeline";

describe("customerMilestone", () => {
  it("collapses internal statuses into customer-facing milestones", () => {
    expect(customerMilestone("new")).toBe("received");
    expect(customerMilestone("in_review")).toBe("received");
    expect(customerMilestone("approved")).toBe("received");
    expect(customerMilestone("in_production")).toBe("in_production");
    expect(customerMilestone("arrived_ch")).toBe("quality_check");
    expect(customerMilestone("qc_passed")).toBe("quality_check");
    // an internal QC fail is never surfaced as such
    expect(customerMilestone("qc_failed")).toBe("quality_check");
    expect(customerMilestone("shipped")).toBe("shipped");
    expect(customerMilestone("problem")).toBe("attention");
    expect(customerMilestone("awaiting_customer_info")).toBe("attention");
  });

  it("exposes the four happy-path milestones in order", () => {
    expect(CUSTOMER_MILESTONES).toEqual(["received", "in_production", "quality_check", "shipped"]);
  });
});
