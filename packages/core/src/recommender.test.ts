import { describe, expect, it } from "vitest";

import {
  type RecommendationCandidate,
  type RecommendationContext,
  type Recommender,
  RecommenderNotFoundError,
  recommend,
  registerRecommender,
  unregisterRecommender,
} from "./recommender";

const candidates: RecommendationCandidate[] = [
  { id: "a", attributes: { occasion: "business", colour: "blue" }, orderable: true },
  { id: "b", attributes: { occasion: "business", colour: "white" }, orderable: true },
  { id: "c", attributes: { occasion: "casual", colour: "blue" }, orderable: true },
  { id: "d", attributes: { occasion: "casual" }, orderable: false },
];

describe("baseline recommender", () => {
  it("ranks curated first, then by shared attributes, excluding the source/owned", () => {
    const ctx: RecommendationContext = {
      candidates,
      contextAttributes: [{ occasion: "business", colour: "blue" }],
      excludeIds: ["a"], // the source model itself
      curatedIds: ["c"], // a curated cross-sell pick
      limit: 3,
    };
    // c is curated (first); b shares occasion=business; d shares nothing relevant.
    expect(recommend(ctx)).toEqual(["c", "b"]);
  });

  it("prefers orderable on a tie and respects the limit", () => {
    const ctx: RecommendationContext = {
      candidates: [
        { id: "x", attributes: { occasion: "business" }, orderable: false },
        { id: "y", attributes: { occasion: "business" }, orderable: true },
      ],
      contextAttributes: [{ occasion: "business" }],
      limit: 1,
    };
    expect(recommend(ctx)).toEqual(["y"]);
  });

  it("falls back to the orderable catalog when there is no signal", () => {
    const ctx: RecommendationContext = {
      candidates,
      contextAttributes: [],
      excludeIds: ["a"],
      limit: 2,
    };
    // No curated, no context attributes: orderable catalog in input order, source excluded.
    expect(recommend(ctx)).toEqual(["b", "c"]);
  });

  it("returns nothing for an empty catalog", () => {
    expect(recommend({ candidates: [], contextAttributes: [] })).toEqual([]);
  });
});

describe("recommender seam", () => {
  it("is swappable: a registered adapter is selected by strategy", () => {
    const fake: Recommender = { strategy: "fake", recommend: () => ["fixed"] };
    registerRecommender(fake);
    try {
      expect(recommend({ candidates, contextAttributes: [] }, "fake")).toEqual(["fixed"]);
    } finally {
      unregisterRecommender("fake");
    }
    expect(() => recommend({ candidates, contextAttributes: [] }, "fake")).toThrow(
      RecommenderNotFoundError,
    );
  });
});
