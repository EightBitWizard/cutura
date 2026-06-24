// Customer accounts data layer (M4). Ownership is enforced inside every helper by
// filtering on customerId in the query - callers pass the authenticated customer
// id and never a caller-supplied owner. Apps reach all of this through @cutura/db,
// never drizzle directly.

/** Thrown when a customer-owned resource is acted on by a non-owner. */
export class NotOwnerError extends Error {
  constructor(resource: string) {
    super(`not the owner of ${resource}`);
    this.name = "NotOwnerError";
  }
}

export * from "./auth";
export * from "./profiles";
export * from "./orders";
export * from "./addresses";
export * from "./reorder";
