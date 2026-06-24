import type { BatchItem } from "drizzle-orm/batch";

import type { Database } from "../getDb";
import { type Environment, auditLog, publication } from "../schema";
import {
  type Resolver,
  resolveAttributeDefinition,
  resolveBaseModel,
  resolveCollection,
  resolveContentPage,
  resolveCrossSellRule,
  resolveFabric,
  resolveGarmentType,
  resolveOptionGroup,
  resolveUpgrade,
} from "./resolvers";
import { copyById } from "./upsert";

export interface PublishOptions {
  /** The control database (canonical catalog + drafts). */
  control: Database;
  /** The target environment database to publish into. */
  target: Database;
  environment: Environment;
  /** Actor recorded on the publication and audit rows. */
  publishedBy: string;
}

export interface PublishResult {
  entityType: string;
  entityId: string;
  environment: Environment;
  publishedAt: string;
}

export class UnknownEntityTypeError extends Error {
  constructor(entityType: string) {
    super(`No publish resolver for entity type "${entityType}".`);
    this.name = "UnknownEntityTypeError";
  }
}

const RESOLVERS: Record<string, Resolver> = {
  garmentType: resolveGarmentType,
  fabric: resolveFabric,
  optionGroup: resolveOptionGroup,
  upgrade: resolveUpgrade,
  attributeDefinition: resolveAttributeDefinition,
  collection: resolveCollection,
  contentPage: resolveContentPage,
  crossSellRule: resolveCrossSellRule,
  baseModel: resolveBaseModel,
};

export const PUBLISHABLE_ENTITY_TYPES = Object.keys(RESOLVERS);

/**
 * Publish a catalog entity into a target environment database: resolve its
 * dependency closure from control, then apply the whole copy in one atomic D1
 * batch, recording a publication row (deterministic id, so re-publish updates)
 * and an audit row. Idempotent. An entity published only to staging never
 * reaches production because production is a different database.
 */
export async function publishEntity(
  entityType: string,
  entityId: string,
  options: PublishOptions,
): Promise<PublishResult> {
  const resolver = RESOLVERS[entityType];
  if (!resolver) throw new UnknownEntityTypeError(entityType);

  const { control, target, environment, publishedBy } = options;
  const now = new Date().toISOString();

  const stmts = await resolver(control, target, entityId);
  stmts.push(
    ...copyById(target, publication, [
      {
        id: `${entityType}:${entityId}:${environment}`,
        entityType,
        entityId,
        environment,
        publishedAt: now,
        publishedBy,
      },
    ]),
  );
  stmts.push(
    target.insert(auditLog).values({
      id: crypto.randomUUID(),
      actor: publishedBy,
      action: "catalog.publish",
      entityType,
      entityId,
      detail: { environment },
      createdAt: now,
    }),
  );

  await target.batch(stmts as [BatchItem<"sqlite">, ...BatchItem<"sqlite">[]]);
  return { entityType, entityId, environment, publishedAt: now };
}
