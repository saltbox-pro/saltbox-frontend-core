import {
  instanceOfMinionFilterGroup,
  MinionFilterGroup,
  type MinionFilterExtraCategorySchema,
} from "@saltbox/saltbox-core-api-client";

export function readMinionFieldGroup(value: unknown): MinionFilterGroup {
  return instanceOfMinionFilterGroup(value)
    ? (value as MinionFilterGroup)
    : MinionFilterGroup.General;
}

export function readMinionFieldExtraCategory(
  value: unknown
): MinionFilterExtraCategorySchema | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const { source, name } = value as { source?: unknown; name?: unknown };
  return typeof source === "string" && source && typeof name === "string" && name
    ? { source, name }
    : undefined;
}
