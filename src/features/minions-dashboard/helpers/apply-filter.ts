import { getFilterFieldOptions } from "@saltbox/saltbox-frontend-common";

import { buildClientFilterRule } from "saltbox-core/shared/helpers/client-filter-rule";
import { toFilterRule } from "saltbox-core/shared/helpers/toggle-filter-rule";
import { MinionFilterStore } from "saltbox-core/store";

export const applyFieldValueFilter = (
  filterStore: MinionFilterStore,
  field: string,
  value: unknown
): boolean => {
  const identity = buildClientFilterRule(
    field,
    value,
    getFilterFieldOptions(filterStore.filterSchema, field)
  );
  if (!identity) {
    return false;
  }

  filterStore.handleFiltersChange({
    ...filterStore.currentFilters,
    rules: [...filterStore.currentFilters.rules, toFilterRule(identity)],
  });
  filterStore.filtersRevision += 1;
  filterStore.handleSearch();
  return true;
};
