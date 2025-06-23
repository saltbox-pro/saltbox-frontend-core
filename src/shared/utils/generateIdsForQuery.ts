import {
  RuleGroupType,
  RuleType,
  generateID,
  isRuleGroupType,
} from "react-querybuilder";

export function generateIdsForQuery<T extends RuleGroupType | RuleType>(
  query: T
): T {
  const newQuery = { ...query };
  newQuery.id = generateID();
  if (isRuleGroupType(newQuery)) {
    newQuery.rules = newQuery.rules.map((rule) => generateIdsForQuery(rule));
  }
  return newQuery;
}
