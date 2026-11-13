import type { CollectionFlatListItemSchema } from "@saltbox/saltbox-core-api-client";

import { ROOT_COLLECTION_SLUG } from "saltbox-core/shared/constants/collection";

export const COLLECTION_FILTER_FIELD = "collection";

const COLLECTION_PATH_SEPARATOR = " / ";

export type CollectionFilterOption = {
  value: string;
  label: string;
};

type CollectionListItem = Pick<CollectionFlatListItemSchema, "id" | "slug" | "title" | "parent_id">;

function buildCollectionPath(
  item: CollectionListItem,
  itemsById: ReadonlyMap<string, CollectionListItem>
): string {
  const titles: string[] = [];
  const visited = new Set<string>();
  let current: CollectionListItem | undefined = item;

  while (current && !visited.has(current.id) && current.slug !== ROOT_COLLECTION_SLUG) {
    visited.add(current.id);
    titles.unshift(current.title);
    current = current.parent_id ? itemsById.get(current.parent_id) : undefined;
  }

  return titles.length ? titles.join(COLLECTION_PATH_SEPARATOR) : item.title;
}

export function buildCollectionLabelBySlug(
  items: ReadonlyArray<CollectionListItem>
): Map<string, string> {
  const itemsById = new Map(items.map((item) => [item.id, item]));
  return new Map(items.map((item) => [item.slug, buildCollectionPath(item, itemsById)]));
}

export function collectSubtreeSlugs(
  items: ReadonlyArray<CollectionListItem>,
  slug: string
): Set<string> {
  const root = items.find((item) => item.slug === slug);
  if (!root) {
    return new Set([slug]);
  }

  const childrenByParentId = new Map<string, CollectionListItem[]>();
  for (const item of items) {
    if (!item.parent_id) continue;
    const children = childrenByParentId.get(item.parent_id) ?? [];
    children.push(item);
    childrenByParentId.set(item.parent_id, children);
  }

  const slugs = new Set<string>();
  const queue = [root];
  for (let index = 0; index < queue.length; index++) {
    const current = queue[index];
    if (slugs.has(current.slug)) continue;
    slugs.add(current.slug);
    queue.push(...(childrenByParentId.get(current.id) ?? []));
  }

  return slugs;
}

export function buildCollectionFilterOptions(
  items: ReadonlyArray<CollectionListItem>,
  excludeSlug?: string
): CollectionFilterOption[] {
  const excludedSlugs = excludeSlug ? collectSubtreeSlugs(items, excludeSlug) : new Set<string>();
  const labelBySlug = buildCollectionLabelBySlug(items);

  return items
    .filter((item) => item.slug !== ROOT_COLLECTION_SLUG && !excludedSlugs.has(item.slug))
    .map((item) => ({ value: item.slug, label: labelBySlug.get(item.slug) ?? item.title }))
    .sort((first, second) => first.label.localeCompare(second.label));
}
