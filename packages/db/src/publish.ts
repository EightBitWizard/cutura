// Catalog publish-and-promotion seam (REQUIREMENTS.md E1 US-1.10, E2 US-2.5;
// FR-190 to FR-192, FR-240). The full routine is implemented in milestone M2:
// it resolves a catalog entity's dependency graph and upserts the published
// version into the target environment database, transactionally (D1 batch),
// idempotently (re-publish is safe), with an audit record. This file defines the
// stable contract now so apps depend on the interface, not the implementation.

import type { Database } from "./getDb";
import type { Environment } from "./schema";

export interface PublishOptions {
  /** The control database (canonical catalog + drafts). */
  control: Database;
  /** The target environment database to publish into. */
  target: Database;
  environment: Environment;
  /** Actor recorded on the publication audit record. */
  publishedBy: string;
}

export interface PublishResult {
  entityType: string;
  entityId: string;
  environment: Environment;
  publishedAt: string;
}

/** The publish routine signature. Implemented in M2 (catalog control plane). */
export type PublishEntity = (
  entityType: string,
  entityId: string,
  options: PublishOptions,
) => Promise<PublishResult>;
