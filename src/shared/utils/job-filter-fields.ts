import { isRuleGroupType, type RuleGroupType } from "react-querybuilder";

export const JOB_CREATED_FILTER_FIELD = "created";

export function getJobFilterFields(filters: RuleGroupType): Set<string> {
  const fields = new Set<string>();

  for (const rule of filters.rules) {
    if (isRuleGroupType(rule)) {
      getJobFilterFields(rule).forEach((field) => fields.add(field));
    } else if (rule.field) {
      fields.add(rule.field);
    }
  }

  return fields;
}

export function hasJobCreatedFilterField(filters: RuleGroupType): boolean {
  return getJobFilterFields(filters).has(JOB_CREATED_FILTER_FIELD);
}
