import { getFilterFieldOptions, type FilterFieldOptions } from "@saltbox/saltbox-frontend-common";
import { generateID, type OptionList, type RuleGroupType, type RuleType } from "react-querybuilder";

import {
  buildClientFilterRule,
  type ClientFilterRule,
} from "saltbox-core/shared/helpers/client-filter-rule";

type ClientFilterStore = {
  filterSchema: OptionList;
  currentFilters: RuleGroupType;
  handleFiltersChange: (filters: RuleGroupType) => void;
  handleSearch: () => void;
};

export type ApplyClientFilterOptions = {
  search?: boolean;
  fieldOptions?: FilterFieldOptions;
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

function isRuleGroup(rule: RuleGroupType["rules"][number]): rule is RuleGroupType {
  return typeof rule === "object" && rule != null && "rules" in rule;
}

function valuesMatch(left: unknown, right: ClientFilterRule["value"]): boolean {
  if (left === right) {
    return true;
  }
  // localStorage / older filters may store checkbox values as "true"/"false"
  return String(left ?? "") === String(right);
}

function matchesRule(rule: RuleType, identity: ClientFilterRule): boolean {
  return (
    rule.field === identity.field &&
    rule.operator === identity.operator &&
    valuesMatch(rule.value, identity.value)
  );
}

function hasMatchingRule(group: RuleGroupType, identity: ClientFilterRule): boolean {
  return group.rules.some((rule) => {
    if (isRuleGroup(rule)) {
      return hasMatchingRule(rule, identity);
    }

    return matchesRule(rule, identity);
  });
}

function removeFirstMatch(
  group: RuleGroupType,
  identity: ClientFilterRule
): { group: RuleGroupType; removed: boolean } {
  let removed = false;
  const rules: RuleGroupType["rules"] = [];

  for (const rule of group.rules) {
    if (removed) {
      rules.push(rule);
      continue;
    }

    if (isRuleGroup(rule)) {
      const nested = removeFirstMatch(rule, identity);
      removed = nested.removed;
      if (nested.group.rules.length > 0) {
        rules.push(nested.group);
      }
      continue;
    }

    if (matchesRule(rule, identity)) {
      removed = true;
      continue;
    }

    rules.push(rule);
  }

  return {
    group: { ...group, rules },
    removed,
  };
}

function toFilterRule(identity: ClientFilterRule): RuleType {
  return {
    id: generateID(),
    field: identity.field,
    operator: identity.operator,
    valueSource: "value",
    value: identity.value,
  };
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

  return hasMatchingRule(filterStore.currentFilters, identity);
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

  const search = options.search ?? false;
  const isActive = hasMatchingRule(filterStore.currentFilters, identity);

  filterStore.handleFiltersChange(
    isActive
      ? removeFirstMatch(filterStore.currentFilters, identity).group
      : {
          ...filterStore.currentFilters,
          rules: [...filterStore.currentFilters.rules, toFilterRule(identity)],
        }
  );

  if (search) {
    filterStore.handleSearch();
  }

  return { ok: true, result: isActive ? "removed" : "added" };
}
