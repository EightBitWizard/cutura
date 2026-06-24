// Recommendation seam (REQUIREMENTS.md E11; FR-1130). A swappable interface with a
// content-based + curated baseline behind it, mirroring the estimator seam: a
// future machine-learning adapter implements Recommender and is selected by
// strategy without a rewrite. Pure ranking over candidate ids; the DB layer gathers
// the candidates and maps the result back to models. Body measurements are never an
// input here (used only for fit relevance, never cross-customer profiling; FR-1141).

export interface RecommendationCandidate {
  id: string;
  /** Catalog attributes as key -> value (e.g. occasion: business), used for similarity. */
  attributes: Record<string, string>;
  orderable: boolean;
}

export interface RecommendationContext {
  candidates: RecommendationCandidate[];
  /** Attribute maps to match against: the current model(s) and the customer's past orders. */
  contextAttributes: Record<string, string>[];
  /** Models to never suggest (the source model, already-owned models). */
  excludeIds?: string[];
  /** Curated cross-sell picks, surfaced first (FR-1110). */
  curatedIds?: string[];
  limit?: number;
}

export interface Recommender {
  readonly strategy: string;
  recommend(ctx: RecommendationContext): string[];
}

export class RecommenderNotFoundError extends Error {
  constructor(strategy: string) {
    super(`No recommender registered for strategy "${strategy}".`);
    this.name = "RecommenderNotFoundError";
  }
}

const registry = new Map<string, Recommender>();

export function registerRecommender(recommender: Recommender): void {
  registry.set(recommender.strategy, recommender);
}

export function unregisterRecommender(strategy: string): void {
  registry.delete(strategy);
}

export function getRecommender(strategy: string): Recommender {
  const recommender = registry.get(strategy);
  if (!recommender) throw new RecommenderNotFoundError(strategy);
  return recommender;
}

/** Recommend candidate ids using the named strategy (default: the baseline). */
export function recommend(ctx: RecommendationContext, strategy = "baseline"): string[] {
  return getRecommender(strategy).recommend(ctx);
}

const CURATED_WEIGHT = 100;
const ATTRIBUTE_MATCH_WEIGHT = 10;

export const baselineRecommender: Recommender = {
  strategy: "baseline",
  recommend(ctx: RecommendationContext): string[] {
    const exclude = new Set(ctx.excludeIds ?? []);
    const curated = new Set(ctx.curatedIds ?? []);
    const limit = ctx.limit ?? 4;

    const visible = ctx.candidates.filter((c) => !exclude.has(c.id));

    const ranked = visible
      .map((c, i) => {
        let relevance = curated.has(c.id) ? CURATED_WEIGHT : 0;
        for (const attrs of ctx.contextAttributes) {
          for (const [key, value] of Object.entries(attrs)) {
            if (c.attributes[key] === value) relevance += ATTRIBUTE_MATCH_WEIGHT;
          }
        }
        return { id: c.id, relevance, orderable: c.orderable, i };
      })
      .filter((s) => s.relevance > 0)
      .sort(
        (a, b) =>
          b.relevance - a.relevance || Number(b.orderable) - Number(a.orderable) || a.i - b.i,
      );

    if (ranked.length > 0) return ranked.slice(0, limit).map((s) => s.id);

    // No curated or content signal: a simple catalog baseline (orderable, in order).
    return visible
      .filter((c) => c.orderable)
      .slice(0, limit)
      .map((c) => c.id);
  },
};

registerRecommender(baselineRecommender);
