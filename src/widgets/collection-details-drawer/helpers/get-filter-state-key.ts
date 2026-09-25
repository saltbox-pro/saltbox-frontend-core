import { isMongoQueryEmpty } from "@saltbox/saltbox-frontend-common";

import type { MinionFilterStore } from "saltbox-core/store";

export function getFilterStateKey(filterStore: MinionFilterStore): string {
  if (filterStore.inputMode === "free-text") {
    try {
      const parsed = JSON.parse(filterStore.freeTextQuery) as object;
      return isMongoQueryEmpty(parsed) ? "{}" : JSON.stringify(parsed);
    } catch {
      return `invalid:${filterStore.freeTextQuery}`;
    }
  }

  const query = filterStore.currentMongoDBQuery;
  return isMongoQueryEmpty(query) ? "{}" : JSON.stringify(query);
}
