import { COLLECTIONS_PATH } from "saltbox-core/shared/constants/collection";

const COLLECTION_SLUG_PATTERN = new RegExp(`^${COLLECTIONS_PATH}/([^/]+)`);
const COLLECTION_PAGE_PATTERN = new RegExp(`^${COLLECTIONS_PATH}/[^/]+/?$`);

export function getCollectionPath(slug: string): string {
  return `${COLLECTIONS_PATH}/${encodeURIComponent(slug)}`;
}

export function matchCollectionSlug(pathname: string): string | null {
  const encodedSlug = pathname.match(COLLECTION_SLUG_PATTERN)?.[1];
  return encodedSlug ? decodeURIComponent(encodedSlug) : null;
}

export function isCollectionPagePath(pathname: string): boolean {
  return COLLECTION_PAGE_PATTERN.test(pathname);
}
