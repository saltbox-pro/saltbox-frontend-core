import { isMongoQueryEmpty } from "@saltbox/saltbox-frontend-common";

import type { MinionFilterStore } from "saltbox-core/store";

export const EMPTY_FILTER_STATE_KEY = "{}";

export function getFilterStateKey(filterStore: MinionFilterStore): string {
  if (filterStore.inputMode === "free-text") {
    try {
      const parsed = JSON.parse(filterStore.freeTextQuery) as object;
      return isMongoQueryEmpty(parsed) ? EMPTY_FILTER_STATE_KEY : JSON.stringify(parsed);
    } catch {
      return `invalid:${filterStore.freeTextQuery}`;
    }
  }

  const query = filterStore.currentMongoDBQuery;
  return isMongoQueryEmpty(query) ? EMPTY_FILTER_STATE_KEY : JSON.stringify(query);
}
