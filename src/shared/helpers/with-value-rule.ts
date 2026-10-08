import type { RuleGroupType, RuleType } from "react-querybuilder";

export function withValueRule(group: RuleGroupType, rule: RuleType): RuleGroupType {
  if (group.rules.length === 0) {
    return { combinator: "and", not: false, rules: [rule] };
  }

  if (group.combinator === "and" && !group.not) {
    return {
      ...group,
      rules: [
        ...group.rules.filter((item) => !("field" in item) || item.field !== rule.field),
        rule,
      ],
    };
  }

  return { combinator: "and", not: false, rules: [group, rule] };
}
