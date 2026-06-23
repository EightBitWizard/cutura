// Order status machine. Single source of truth for the allowed transitions,
// shared by the admin UI (which renders only the buttons the server accepts)
// and the server-side enforcement. See REQUIREMENTS.md E8 (US-8.3, FR-820 to
// FR-822) and the CLAUDE.md architecture invariants.
//
// Safety-critical rules encoded here:
//   - The manual approval gate: a new order can only enter "in_review", never
//     jump straight to "approved" or "shipped".
//   - A QC fail can never become a pass, nor ship, via a normal transition. The
//     only path past a fail without re-inspection is an audited override
//     (isQcOverrideAllowed), applied and logged by the operational layer.
//   - "problem" is reachable from any non-problem state for escalation.

export type OrderStatus =
  | "new"
  | "in_review"
  | "approved"
  | "in_production"
  | "arrived_ch"
  | "qc_passed"
  | "qc_failed"
  | "awaiting_customer_info"
  | "shipped"
  | "problem";

export const ORDER_STATUSES: readonly OrderStatus[] = [
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
] as const;

export const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  new: ["in_review", "problem"],
  in_review: ["approved", "awaiting_customer_info", "problem"],
  approved: ["in_production", "problem"],
  in_production: ["arrived_ch", "problem"],
  arrived_ch: ["qc_passed", "qc_failed", "problem"],
  qc_passed: ["shipped", "problem"],
  // No "qc_passed" and no "shipped": a fail is cleared only by re-inspection
  // (back to arrived_ch) or an audited override.
  qc_failed: ["arrived_ch", "awaiting_customer_info", "problem"],
  awaiting_customer_info: ["in_review", "approved", "in_production", "problem"],
  shipped: ["problem"],
  problem: ["new", "in_review", "approved", "in_production", "awaiting_customer_info"],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return (VALID_TRANSITIONS[from] ?? []).includes(to);
}

export function getAllowedTransitions(from: OrderStatus): OrderStatus[] {
  return VALID_TRANSITIONS[from] ?? [];
}

/**
 * Whether a garment may ship despite a QC fail via an explicit, audited override.
 * Permitted only from qc_failed. The override itself (with reason and actor) is
 * applied and recorded by the operational layer; this guard keeps it the single
 * legitimate path past a fail. See REQUIREMENTS.md FR-890, FR-891.
 */
export function isQcOverrideAllowed(from: OrderStatus): boolean {
  return from === "qc_failed";
}
