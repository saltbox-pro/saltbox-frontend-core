import type { CollectionDetailSchema } from "@saltbox/saltbox-core-api-client";

import { ROOT_COLLECTION_SLUG } from "saltbox-core/shared/constants/collection";

import type { CollectionCreateDraft } from "../types";

export function buildEmptyCreateDraft(parentSlug: string): CollectionCreateDraft {
  return { title: "", description: "", parent_slug: parentSlug, query: {} };
}

export function buildDuplicateCreateDraft(
  source: CollectionDetailSchema,
  formatTitle: (title: string) => string
): CollectionCreateDraft {
  return {
    title: formatTitle(source.title),
    description: source.description ?? "",
    parent_slug: source.parent_slug ?? ROOT_COLLECTION_SLUG,
    query: source.query ?? {},
  };
}
