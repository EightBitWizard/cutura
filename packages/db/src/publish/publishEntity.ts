import type { BatchItem } from "drizzle-orm/batch";

import type { Database } from "../getDb";
import { type Environment, auditLog, media, publication } from "../schema";
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

/** Minimal R2 surfaces the media copy needs; the admin route adapts its R2 buckets to these. Injected so the routine is env-free + testable. */
export interface MediaObjectMeta {
  contentType?: string;
}
export interface MediaReadBucket {
  // body is opaque (an R2 object body / stream) to avoid cross-package ReadableStream
  // type variance; it is passed straight back to the target bucket's put.
  get(key: string): Promise<{ body: unknown; httpMetadata?: MediaObjectMeta } | null>;
}
export interface MediaWriteBucket {
  head(key: string): Promise<unknown | null>;
  put(key: string, value: unknown, options?: { httpMetadata?: MediaObjectMeta }): Promise<unknown>;
}
export interface MediaBucketPair {
  source: MediaReadBucket;
  target: MediaWriteBucket;
}

export interface PublishOptions {
  /** The control database (canonical catalog + drafts). */
  control: Database;
  /** The target environment database to publish into. */
  target: Database;
  environment: Environment;
  /** Actor recorded on the publication and audit rows. */
  publishedBy: string;
  /** Optional control->target R2 buckets; when given, published media objects are copied. */
  media?: MediaBucketPair;
}

export interface PublishResult {
  entityType: string;
  entityId: string;
  environment: Environment;
  publishedAt: string;
  /** How many media objects were copied into the target bucket (0 if no buckets given). */
  mediaCopied: number;
}

/**
 * Copy any published media objects that are missing from the target bucket
 * (idempotent via head()). Self-healing: a re-publish backfills anything missed.
 * The catalog is small at launch; per-entity scoping is a scale follow-up.
 */
export async function copyPublishedMedia(
  target: Database,
  buckets: MediaBucketPair,
): Promise<number> {
  const rows = await target.select({ key: media.r2Key }).from(media);
  const keys = [...new Set(rows.map((r) => r.key))];
  let copied = 0;
  for (const key of keys) {
    if (await buckets.target.head(key)) continue;
    const object = await buckets.source.get(key);
    if (!object) continue;
    await buckets.target.put(key, object.body, { httpMetadata: object.httpMetadata });
    copied++;
  }
  return copied;
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

  // After the catalog rows land, copy the referenced media objects into the target
  // bucket so the storefront serves them (the D1 rows alone are not enough).
  const mediaCopied = options.media ? await copyPublishedMedia(target, options.media) : 0;
  return { entityType, entityId, environment, publishedAt: now, mediaCopied };
}
