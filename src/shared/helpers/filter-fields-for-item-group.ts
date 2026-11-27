import {
  createRuleGroup,
  getExtraCategoryPrefix,
  ITEM_COMBINATOR_OR,
  isItemCombinator,
  isScalarArrayFilter,
  type QueryCombinator,
} from "@saltbox/saltbox-frontend-common";
import {
  findPath,
  isRuleGroupType,
  isRuleType,
  type Path,
  type RuleGroupType,
  type RuleGroupTypeAny,
  type RuleType,
} from "react-querybuilder";

import type { MinionSchemaField } from "./minion-field-cascader";

function getSharedItemBoundary(fields: ReadonlyArray<string>): string | null {
  let shared: string | null = null;

  for (const field of fields) {
    const prefix = getExtraCategoryPrefix(field);
    if (!prefix) {
      return null;
    }
    if (shared == null) {
      shared = prefix;
      continue;
    }
    if (shared !== prefix) {
      return null;
    }
  }

  return shared;
}

function collectRuleFieldNames(group: RuleGroupTypeAny, excludedPath?: Path): string[] {
  const names: string[] = [];

  group.rules.forEach((rule, index) => {
    if (excludedPath?.length === 1 && excludedPath[0] === index) {
      return;
    }
    if (isRuleGroupType(rule)) {
      names.push(
        ...collectRuleFieldNames(
          rule,
          excludedPath?.[0] === index ? excludedPath.slice(1) : undefined
        )
      );
      return;
    }
    if (!isRuleType(rule) || !rule.field) {
      return;
    }
    names.push(rule.field);
  });

  return names;
}

export function getItemGroupFieldConstraint(
  query: RuleGroupTypeAny,
  path: Path
): { active: false } | { active: true; categoryPrefix: string | null } {
  for (let depth = path.length - 1; depth >= 0; depth--) {
    const group = findPath(path.slice(0, depth), query);
    if (group && isRuleGroupType(group) && isItemCombinator(group.combinator)) {
      return {
        active: true,
        categoryPrefix: getSharedItemBoundary(collectRuleFieldNames(group, path.slice(depth))),
      };
    }
  }

  return { active: false };
}

export function filterMinionFieldsForItemGroup(
  fields: ReadonlyArray<MinionSchemaField>,
  categoryPrefix: string | null
): MinionSchemaField[] {
  return fields.filter((field) => {
    const prefix = getExtraCategoryPrefix(field.name);
    return prefix != null && (!categoryPrefix || categoryPrefix === prefix);
  });
}

export function resolveItemGroupDefaultField(
  rule: RuleType,
  parentPath: Path,
  query: RuleGroupTypeAny,
  fields: ReadonlyArray<MinionSchemaField>
): RuleType | false {
  const parent = findPath(parentPath, query);
  if (!parent || !isRuleGroupType(parent)) return rule;
  const constraint = getItemGroupFieldConstraint(query, [...parentPath, parent.rules.length]);
  if (!constraint.active) return rule;

  const [defaultField] = filterMinionFieldsForItemGroup(fields, constraint.categoryPrefix);
  if (!defaultField) {
    return false;
  }

  if (rule.field === defaultField.name) return rule;
  return {
    ...rule,
    field: defaultField.name,
    operator: isScalarArrayFilter(defaultField) ? "in" : "=",
    value: "",
  };
}

export function canSelectItemCombinator(
  rules: ReadonlyArray<RuleType | RuleGroupTypeAny | string>,
  fields: ReadonlyArray<MinionSchemaField>
): boolean {
  const allowedFields = new Set(
    filterMinionFieldsForItemGroup(fields, null).map(({ name }) => name)
  );
  if (rules.length === 0) return allowedFields.size > 0;

  const names: string[] = [];
  for (const rule of rules) {
    if (isRuleGroupType(rule) || !isRuleType(rule) || !allowedFields.has(rule.field)) return false;
    names.push(rule.field);
  }

  return getSharedItemBoundary(names) != null;
}

function getRuleItemBoundary(rule: RuleGroupType["rules"][number]): string | null | undefined {
  if (!isRuleGroupType(rule)) return getExtraCategoryPrefix(rule.field);
  if (isItemCombinator(rule.combinator)) return null;
  const boundaries = new Set(rule.rules.map(getRuleItemBoundary));
  boundaries.delete(undefined);
  if (!boundaries.size) return undefined;
  return boundaries.size === 1 ? [...boundaries][0] : null;
}

function splitItemGroupRules(
  combinator: QueryCombinator,
  rules: RuleGroupType["rules"]
): RuleGroupType {
  const groups = new Map<string, RuleGroupType["rules"]>();
  const outside: RuleGroupType["rules"] = [];

  const pending: RuleGroupType["rules"] = [];
  for (const rule of rules) {
    const boundary = getRuleItemBoundary(rule);
    if (boundary === undefined) {
      pending.push(rule);
      continue;
    }
    if (!boundary) {
      outside.push(rule);
      continue;
    }
    const group = groups.get(boundary);
    if (group) group.push(rule);
    else groups.set(boundary, [rule]);
  }

  if (!outside.length && groups.size <= 1) return createRuleGroup(combinator, rules);

  return createRuleGroup(combinator === ITEM_COMBINATOR_OR ? "or" : "and", [
    ...Array.from(groups.values(), (children) => createRuleGroup(combinator, children)),
    ...outside,
    ...pending,
  ]);
}

export function normalizeItemGroupFields(
  query: RuleGroupType,
  fields: ReadonlyArray<MinionSchemaField>
): RuleGroupType {
  if (!fields.length) return query;

  const mappedRules = query.rules.map((rule) => {
    if (isRuleGroupType(rule)) {
      return normalizeItemGroupFields(rule, fields);
    }
    return rule;
  });

  if (isItemCombinator(query.combinator)) {
    const split = splitItemGroupRules(query.combinator, mappedRules);
    if (split.combinator !== query.combinator) {
      return query.not ? { ...split, not: true } : split;
    }
  }

  return mappedRules.every((rule, index) => rule === query.rules[index])
    ? query
    : { ...query, rules: mappedRules };
}
