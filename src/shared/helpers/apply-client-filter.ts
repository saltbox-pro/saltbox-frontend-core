import { getFilterFieldOptions, type FilterFieldOptions } from "@saltbox/saltbox-frontend-common";
import { type OptionList, type RuleGroupType } from "react-querybuilder";

import {
  buildClientFilterRule,
  type ClientFilterRule,
} from "saltbox-core/shared/helpers/client-filter-rule";
import {
  hasFilterRule,
  toggleFilterRule,
  type ToggleFilterRuleMode,
} from "saltbox-core/shared/helpers/toggle-filter-rule";

type ClientFilterStore = {
  filterSchema: OptionList;
  currentFilters: RuleGroupType;
  filtersRevision: number;
  handleFiltersChange: (filters: RuleGroupType) => void;
  handleSearch: () => void;
};

export type ApplyClientFilterOptions = {
  search?: boolean;
  fieldOptions?: FilterFieldOptions;
  mode?: ToggleFilterRuleMode;
};

export type ApplyClientFilterResult =
  | { ok: false; reason: "unsupported" }
  | { ok: true; result: "added" | "removed" };

function resolveFieldOptions(
  filterStore: ClientFilterStore,
  field: string,
  fieldOptions?: FilterFieldOptions
): FilterFieldOptions {
  return fieldOptions ?? getFilterFieldOptions(filterStore.filterSchema, field);
}

function buildRule(
  filterStore: ClientFilterStore,
  field: string,
  value: unknown,
  fieldOptions?: FilterFieldOptions
): ClientFilterRule | null {
  return buildClientFilterRule(field, value, resolveFieldOptions(filterStore, field, fieldOptions));
}

export function canApplyClientFilter(
  filterStore: ClientFilterStore,
  field: string,
  value: unknown,
  fieldOptions?: FilterFieldOptions
): boolean {
  return buildRule(filterStore, field, value, fieldOptions) != null;
}

export function hasClientFilter(
  filterStore: ClientFilterStore,
  field: string,
  value: unknown,
  fieldOptions?: FilterFieldOptions
): boolean {
  const identity = buildRule(filterStore, field, value, fieldOptions);
  if (!identity) {
    return false;
  }

  return hasFilterRule(filterStore.currentFilters, identity);
}

export function applyClientFilter(
  filterStore: ClientFilterStore,
  field: string,
  value: unknown,
  options: ApplyClientFilterOptions = {}
): ApplyClientFilterResult {
  const identity = buildRule(filterStore, field, value, options.fieldOptions);
  if (!identity) {
    return { ok: false, reason: "unsupported" };
  }

  const { group, result } = toggleFilterRule(
    filterStore.currentFilters,
    identity,
    options.mode ?? "append"
  );
  filterStore.handleFiltersChange(group);
  filterStore.filtersRevision += 1;

  if (options.search ?? false) {
    filterStore.handleSearch();
  }

  return { ok: true, result };
}
