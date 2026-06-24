// Map internal order statuses to the small set of customer-facing milestones for
// the order timeline (FR-6C0). Internal/ops detail (QC fail, supplier, cost) is
// never surfaced: a qc_failed item still shows "quality check" to the customer,
// and problem/awaiting collapse to "attention". Pure; used by the account order
// page and the public tracking page.

import type { OrderStatus } from "./status";

export type CustomerMilestone =
  | "received"
  | "in_production"
  | "quality_check"
  | "shipped"
  | "attention";

/** The four happy-path milestones, in order, for a progress indicator. */
export const CUSTOMER_MILESTONES: readonly CustomerMilestone[] = [
  "received",
  "in_production",
  "quality_check",
  "shipped",
] as const;

export function customerMilestone(status: OrderStatus): CustomerMilestone {
  switch (status) {
    case "new":
    case "in_review":
    case "approved":
      return "received";
    case "in_production":
      return "in_production";
    case "arrived_ch":
    case "qc_passed":
    case "qc_failed":
      return "quality_check";
    case "shipped":
      return "shipped";
    case "awaiting_customer_info":
    case "problem":
      return "attention";
    default:
      return "received";
  }
}
