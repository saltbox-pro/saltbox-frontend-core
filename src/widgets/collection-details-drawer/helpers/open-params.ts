import type { CollectionDetailSchema } from "@saltbox/saltbox-core-api-client";

import type { CollectionDetailsDrawerOpenParams } from "../types";

export function buildViewOpenParams(id: string, slug: string): CollectionDetailsDrawerOpenParams {
  return { mode: "view", id, slug };
}

export function buildCreateOpenParams(parentSlug: string): CollectionDetailsDrawerOpenParams {
  return { mode: "create", id: `create:${parentSlug}`, parentSlug };
}

export function buildDuplicateOpenParams(
  sourceSlug: string,
  preloadedSource?: CollectionDetailSchema
): CollectionDetailsDrawerOpenParams {
  return { mode: "duplicate", id: `duplicate:${sourceSlug}`, sourceSlug, preloadedSource };
}
