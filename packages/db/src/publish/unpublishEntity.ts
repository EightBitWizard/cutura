import type { BatchItem } from "drizzle-orm/batch";
import { type SQL, and, eq } from "drizzle-orm";

import type { Database } from "../getDb";
import {
  type Environment,
  attributeValue,
  auditLog,
  baseModel,
  collection,
  collectionMember,
  fabric,
  garmentType,
  media,
  modelAllowedFabric,
  modelAllowedOption,
  modelAllowedUpgrade,
  optionGroup,
  optionValue,
  publication,
  upgrade,
} from "../schema";
import { UnknownEntityTypeError } from "./publishEntity";

export interface UnpublishResult {
  entityType: string;
  entityId: string;
  environment: Environment;
  unpublishedAt: string;
}

const both = (a: SQL | undefined, b: SQL | undefined): SQL => and(a, b) as SQL;

/**
 * Statements that remove the top entity row and its OWNED children from the
 * target. Shared leaf rows (a fabric used by another model, etc.) are left in
 * place to avoid orphaning; unreferenced leaves are harmless.
 */
function removeEntity(target: Database, entityType: string, id: string): BatchItem<"sqlite">[] {
  switch (entityType) {
    case "fabric":
      return [
        target.delete(media).where(both(eq(media.entityType, "fabric"), eq(media.entityId, id))),
        target
          .delete(attributeValue)
          .where(both(eq(attributeValue.entityType, "fabric"), eq(attributeValue.entityId, id))),
        target.delete(fabric).where(eq(fabric.id, id)),
      ];
    case "baseModel":
      return [
        target.delete(modelAllowedFabric).where(eq(modelAllowedFabric.baseModelId, id)),
        target.delete(modelAllowedOption).where(eq(modelAllowedOption.baseModelId, id)),
        target.delete(modelAllowedUpgrade).where(eq(modelAllowedUpgrade.baseModelId, id)),
        target.delete(media).where(both(eq(media.entityType, "model"), eq(media.entityId, id))),
        target
          .delete(attributeValue)
          .where(both(eq(attributeValue.entityType, "model"), eq(attributeValue.entityId, id))),
        target.delete(baseModel).where(eq(baseModel.id, id)),
      ];
    case "collection":
      return [
        target.delete(collectionMember).where(eq(collectionMember.collectionId, id)),
        target
          .delete(media)
          .where(both(eq(media.entityType, "collection"), eq(media.entityId, id))),
        target.delete(collection).where(eq(collection.id, id)),
      ];
    case "optionGroup":
      return [
        target.delete(optionValue).where(eq(optionValue.optionGroupId, id)),
        target.delete(optionGroup).where(eq(optionGroup.id, id)),
      ];
    case "upgrade":
      return [
        target.delete(media).where(both(eq(media.entityType, "upgrade"), eq(media.entityId, id))),
        target.delete(upgrade).where(eq(upgrade.id, id)),
      ];
    case "garmentType":
      return [target.delete(garmentType).where(eq(garmentType.id, id))];
    default:
      throw new UnknownEntityTypeError(entityType);
  }
}

export async function unpublishEntity(
  entityType: string,
  entityId: string,
  options: { target: Database; environment: Environment; publishedBy: string },
): Promise<UnpublishResult> {
  const { target, environment, publishedBy } = options;
  const now = new Date().toISOString();

  const stmts = removeEntity(target, entityType, entityId);
  stmts.push(
    target
      .delete(publication)
      .where(
        both(
          both(eq(publication.entityType, entityType), eq(publication.entityId, entityId)),
          eq(publication.environment, environment),
        ),
      ),
  );
  stmts.push(
    target.insert(auditLog).values({
      id: crypto.randomUUID(),
      actor: publishedBy,
      action: "catalog.unpublish",
      entityType,
      entityId,
      detail: { environment },
      createdAt: now,
    }),
  );

  await target.batch(stmts as [BatchItem<"sqlite">, ...BatchItem<"sqlite">[]]);
  return { entityType, entityId, environment, unpublishedAt: now };
}
