import { generateID, type RuleGroupType, type RuleType } from "react-querybuilder";

import { withValueRule } from "saltbox-core/shared/helpers/with-value-rule";

export type FilterRuleIdentity = {
  field: string;
  operator: string;
  value: string | number | boolean;
};

// append: add rule as-is
// replace-field: withValueRule (keeps nested groups / wraps OR|NOT)
// flatten-field: top-level only, drops nested groups
export type ToggleFilterRuleMode = "append" | "replace-field" | "flatten-field";

type ToggleFilterRuleResult = {
  group: RuleGroupType;
  result: "added" | "removed";
};

function isRuleGroup(rule: RuleGroupType["rules"][number]): rule is RuleGroupType {
  return typeof rule === "object" && rule != null && "rules" in rule;
}

function withFlattenedFieldRule(group: RuleGroupType, rule: RuleType): RuleGroupType {
  return {
    combinator: "and",
    rules: [...group.rules.filter((item) => "field" in item && item.field !== rule.field), rule],
  };
}

function valuesMatch(left: unknown, right: FilterRuleIdentity["value"]): boolean {
  if (left === right) {
    return true;
  }
  return String(left ?? "") === String(right);
}

function matchesRule(rule: RuleType, identity: FilterRuleIdentity): boolean {
  return (
    rule.field === identity.field &&
    rule.operator === identity.operator &&
    valuesMatch(rule.value, identity.value)
  );
}

export function hasFilterRule(group: RuleGroupType, identity: FilterRuleIdentity): boolean {
  return group.rules.some((rule) => {
    if (isRuleGroup(rule)) {
      return hasFilterRule(rule, identity);
    }

    return matchesRule(rule, identity);
  });
}

function removeFirstMatch(
  group: RuleGroupType,
  identity: FilterRuleIdentity
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

export function toFilterRule(identity: FilterRuleIdentity): RuleType {
  return {
    id: generateID(),
    field: identity.field,
    operator: identity.operator,
    valueSource: "value",
    value: identity.value,
  };
}

export function toggleFilterRule(
  group: RuleGroupType,
  identity: FilterRuleIdentity,
  mode: ToggleFilterRuleMode = "append"
): ToggleFilterRuleResult {
  const removed = removeFirstMatch(group, identity);
  if (removed.removed) {
    return {
      group: removed.group,
      result: "removed",
    };
  }

  const rule = toFilterRule(identity);

  if (mode === "replace-field") {
    return {
      group: withValueRule(group, rule),
      result: "added",
    };
  }

  if (mode === "flatten-field") {
    return {
      group: withFlattenedFieldRule(group, rule),
      result: "added",
    };
  }

  return {
    group: {
      ...group,
      rules: [...group.rules, rule],
    },
    result: "added",
  };
}
