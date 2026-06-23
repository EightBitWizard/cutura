import { describe, expect, it } from "vitest";

import {
  ORDER_STATUSES,
  VALID_TRANSITIONS,
  canTransition,
  getAllowedTransitions,
  isQcOverrideAllowed,
  type OrderStatus,
} from "./status";

describe("order status set", () => {
  it("matches the requirements (E8) state set", () => {
    expect([...ORDER_STATUSES].sort()).toEqual(
      [
        "new",
        "in_review",
        "approved",
        "in_production",
        "arrived_ch",
        "qc_passed",
        "qc_failed",
        "awaiting_customer_info",
        "shipped",
        "problem",
      ].sort(),
    );
  });
});

describe("canTransition - the manual approval gate", () => {
  it("routes a new order into review, never straight to approved or shipped", () => {
    expect(canTransition("new", "in_review")).toBe(true);
    expect(canTransition("new", "approved")).toBe(false);
    expect(canTransition("new", "shipped")).toBe(false);
  });

  it("approves only out of review", () => {
    expect(canTransition("in_review", "approved")).toBe(true);
  });

  it("moves approved orders into production and on to arrival", () => {
    expect(canTransition("approved", "in_production")).toBe(true);
    expect(canTransition("in_production", "arrived_ch")).toBe(true);
  });
});

describe("canTransition - QC guards (safety critical)", () => {
  it("lets an arrived garment pass or fail QC", () => {
    expect(canTransition("arrived_ch", "qc_passed")).toBe(true);
    expect(canTransition("arrived_ch", "qc_failed")).toBe(true);
  });

  it("ships only a passed garment", () => {
    expect(canTransition("qc_passed", "shipped")).toBe(true);
  });

  it("never lets a failed garment become passed by a normal transition", () => {
    expect(canTransition("qc_failed", "qc_passed")).toBe(false);
  });

  it("never lets a failed garment ship by a normal transition", () => {
    expect(canTransition("qc_failed", "shipped")).toBe(false);
  });

  it("allows a failed garment back to re-inspection after rework", () => {
    expect(canTransition("qc_failed", "arrived_ch")).toBe(true);
  });
});

describe("isQcOverrideAllowed - the only audited path past a fail", () => {
  it("is allowed only from qc_failed", () => {
    expect(isQcOverrideAllowed("qc_failed")).toBe(true);
  });

  it("is not allowed from any other state", () => {
    const others: OrderStatus[] = [
      "new",
      "in_review",
      "approved",
      "in_production",
      "arrived_ch",
      "qc_passed",
      "awaiting_customer_info",
      "shipped",
      "problem",
    ];
    for (const s of others) {
      expect(isQcOverrideAllowed(s)).toBe(false);
    }
  });
});

describe("problem state", () => {
  it("is reachable from every non-problem state", () => {
    for (const s of ORDER_STATUSES) {
      if (s === "problem") continue;
      expect(canTransition(s, "problem")).toBe(true);
    }
  });
});

describe("getAllowedTransitions", () => {
  it("returns the exact allow-list for a state", () => {
    expect(getAllowedTransitions("shipped")).toEqual(["problem"]);
  });

  it("returns an empty list for an unknown state", () => {
    expect(getAllowedTransitions("not_a_state" as OrderStatus)).toEqual([]);
  });

  it("is consistent with VALID_TRANSITIONS", () => {
    for (const s of ORDER_STATUSES) {
      expect(getAllowedTransitions(s)).toEqual(VALID_TRANSITIONS[s]);
    }
  });
});
