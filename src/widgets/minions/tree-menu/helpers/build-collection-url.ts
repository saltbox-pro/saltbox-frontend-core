import {
  COLLECTION_TAB_QUERY_PARAM,
  EXTRA_DATA_CATEGORY_QUERY_PARAM,
} from "saltbox-core/shared/constants/collection";
import {
  getCollectionPath,
  isCollectionPagePath,
} from "saltbox-core/shared/helpers/collection-route";

const PRESERVED_QUERY_PARAMS = [COLLECTION_TAB_QUERY_PARAM, EXTRA_DATA_CATEGORY_QUERY_PARAM];

export function buildCollectionUrl(
  slug: string,
  currentPathname: string,
  currentSearch: string
): string {
  const collectionPath = getCollectionPath(slug);
  if (!isCollectionPagePath(currentPathname)) return collectionPath;

  const currentParams = new URLSearchParams(currentSearch);
  const preservedParams = new URLSearchParams();
  for (const name of PRESERVED_QUERY_PARAMS) {
    const value = currentParams.get(name);
    if (value) preservedParams.set(name, value);
  }

  const query = preservedParams.toString();
  return query ? `${collectionPath}?${query}` : collectionPath;
}
