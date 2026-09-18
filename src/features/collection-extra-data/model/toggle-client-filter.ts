import { generateID, type OptionList, type RuleGroupType, type RuleType } from "react-querybuilder";

import {
  buildExtraDataFilterField,
  isExtraDataPrimitive,
} from "saltbox-core/shared/helpers/extra-data-value";

export type CellFilterParams = {
  categorySource: string;
  categoryName: string;
  field: string;
  value: unknown;
  supportsNull: boolean;
};

type RuleIdentity = {
  field: string;
  operator: string;
  value: string;
};

export type ClientFilterToggleResult = {
  filters: RuleGroupType;
  result: "added" | "removed";
};

function toRuleIdentity(params: CellFilterParams): RuleIdentity | null {
  const field = buildExtraDataFilterField(params.categorySource, params.categoryName, params.field);

  if (params.value == null) {
    if (!params.supportsNull) {
      return null;
    }

    return { field, operator: "null", value: "" };
  }

  if (params.value === "") {
    return { field, operator: "=", value: "" };
  }

  if (Array.isArray(params.value)) {
    if (params.value.length === 0 || !params.value.every(isExtraDataPrimitive)) {
      return null;
    }

    return {
      field,
      operator: "in",
      value: params.value.map((item) => String(item)).join(","),
    };
  }

  if (!isExtraDataPrimitive(params.value)) {
    return null;
  }

  return {
    field,
    operator: "=",
    value: String(params.value),
  };
}

function isRuleGroup(rule: RuleGroupType["rules"][number]): rule is RuleGroupType {
  return typeof rule === "object" && rule != null && "rules" in rule;
}

function matchesRule(rule: RuleType, identity: RuleIdentity): boolean {
  return (
    rule.field === identity.field &&
    rule.operator === identity.operator &&
    String(rule.value ?? "") === identity.value
  );
}

function hasMatchingRule(group: RuleGroupType, identity: RuleIdentity): boolean {
  return group.rules.some((rule) => {
    if (isRuleGroup(rule)) {
      return hasMatchingRule(rule, identity);
    }

    return matchesRule(rule, identity);
  });
}

function removeFirstMatch(
  group: RuleGroupType,
  identity: RuleIdentity
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

function readOperatorName(operator: unknown): string | null {
  if (typeof operator === "string") {
    return operator;
  }

  if (typeof operator === "object" && operator != null && "name" in operator) {
    const name = operator.name;
    return typeof name === "string" ? name : null;
  }

  return null;
}

function isOptionGroup(item: unknown): item is { options: OptionList } {
  return (
    typeof item === "object" &&
    item != null &&
    "options" in item &&
    Array.isArray(item.options) &&
    !("name" in item)
  );
}

function findFieldOperators(schema: OptionList, fieldName: string): unknown[] | undefined {
  for (const item of schema) {
    if (isOptionGroup(item)) {
      const nested = findFieldOperators(item.options, fieldName);
      if (nested) {
        return nested;
      }
      continue;
    }

    if (typeof item === "object" && item != null && "name" in item && item.name === fieldName) {
      const operators = "operators" in item ? item.operators : undefined;
      return Array.isArray(operators) ? operators : undefined;
    }
  }

  return undefined;
}

export function fieldSupportsNullOperator(schema: OptionList, fieldName: string): boolean {
  const operators = findFieldOperators(schema, fieldName);
  if (!operators) {
    return false;
  }

  return operators.some((operator) => readOperatorName(operator) === "null");
}

export function canBuildClientFilter(params: CellFilterParams): boolean {
  return toRuleIdentity(params) != null;
}

export function hasClientFilter(filters: RuleGroupType, params: CellFilterParams): boolean {
  const identity = toRuleIdentity(params);
  if (!identity) {
    return false;
  }

  return hasMatchingRule(filters, identity);
}

export function toggleClientFilter(
  filters: RuleGroupType,
  params: CellFilterParams
): ClientFilterToggleResult | null {
  const identity = toRuleIdentity(params);
  if (!identity) {
    return null;
  }

  if (hasMatchingRule(filters, identity)) {
    return {
      filters: removeFirstMatch(filters, identity).group,
      result: "removed",
    };
  }

  return {
    filters: {
      ...filters,
      rules: [
        ...filters.rules,
        {
          id: generateID(),
          field: identity.field,
          operator: identity.operator,
          valueSource: "value",
          value: identity.value,
        },
      ],
    },
    result: "added",
  };
}
