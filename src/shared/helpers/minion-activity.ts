import type { MinionShortSchema } from "@saltbox/saltbox-core-api-client";

export type MinionActivityFlags = Pick<MinionShortSchema, "is_never_active" | "is_not_active">;

export type MinionActivityStatus = "never-active" | "active" | "inactive";

export const isMinionNeverActive = (minion: MinionActivityFlags | null | undefined): boolean =>
  minion?.is_never_active === true;

export const getMinionActivityStatus = (minion: MinionActivityFlags): MinionActivityStatus => {
  if (isMinionNeverActive(minion)) return "never-active";
  if (minion.is_not_active === false) return "active";

  return "inactive";
};
