// Catalog publish-and-promotion routine. Resolves an entity's dependency closure
// from the control database and copies it into a target environment database in
// one atomic D1 batch, recording a publication row and an audit entry. See
// REQUIREMENTS.md E1 US-1.10, E2 US-2.5 (FR-190..192, FR-240) and
// docs/DECISIONS/0002.

export {
  type PublishOptions,
  type PublishResult,
  PUBLISHABLE_ENTITY_TYPES,
  UnknownEntityTypeError,
  publishEntity,
} from "./publishEntity";
export { type UnpublishResult, unpublishEntity } from "./unpublishEntity";
export { type Resolver, EntityNotFoundError } from "./resolvers";
