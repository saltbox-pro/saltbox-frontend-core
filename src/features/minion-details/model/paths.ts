import { DEFAULT_MINION_DETAILS_TAB, type MinionDetailsTabKey } from "./tabs";

export function buildMinionDetailsPagePath(
  slug: string,
  innerId: string,
  tab?: MinionDetailsTabKey
): string {
  const base = `/core/minions/${slug}/${innerId}`;
  if (!tab || tab === DEFAULT_MINION_DETAILS_TAB) {
    return base;
  }
  return `${base}?tab=${tab}`;
}

export function buildMasterMinionRedirectPath(saltMaster: string, minionId: string): string {
  return `/core/masters/${saltMaster}/minion/${minionId}`;
}
