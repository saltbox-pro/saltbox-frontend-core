import type { TaskTargetMinion } from "@saltbox/saltbox-core-api-client";
import { createRuleGroup } from "@saltbox/saltbox-frontend-common";
import type { RuleGroupType, RuleType } from "react-querybuilder";

export function createMinionIdsRuleGroup(minions: TaskTargetMinion[]): RuleGroupType {
  const minionIds = minions
    .map((minion) => minion.minion_id)
    .filter(Boolean)
    .join(",");

  const rule: RuleType = {
    field: "minion_id",
    operator: "in",
    value: minionIds,
    valueSource: "value",
  };

  return createRuleGroup("and", [rule]);
}
