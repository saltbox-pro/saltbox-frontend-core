export const MINION_DETAILS_TAB_KEYS = [
  "dashboard",
  "job-returns",
  "grains",
  "pillars",
  "extra-data",
  "terminal",
] as const;

export type MinionDetailsTabKey = (typeof MINION_DETAILS_TAB_KEYS)[number];

export const DEFAULT_MINION_DETAILS_TAB: MinionDetailsTabKey = "dashboard";

export const MINION_DETAILS_DRAWER_TAB_KEYS = [
  "dashboard",
  "grains",
  "pillars",
  "extra-data",
  "terminal",
] as const satisfies readonly MinionDetailsTabKey[];

export function getMinionDetailsTabKeys(isInDrawer: boolean): readonly MinionDetailsTabKey[] {
  return isInDrawer ? MINION_DETAILS_DRAWER_TAB_KEYS : MINION_DETAILS_TAB_KEYS;
}

export function parseMinionDetailsTabKey(
  value: string | null | undefined,
  isInDrawer: boolean
): MinionDetailsTabKey {
  const allowed = getMinionDetailsTabKeys(isInDrawer);

  if (value && allowed.includes(value as MinionDetailsTabKey)) {
    return value as MinionDetailsTabKey;
  }

  return DEFAULT_MINION_DETAILS_TAB;
}
