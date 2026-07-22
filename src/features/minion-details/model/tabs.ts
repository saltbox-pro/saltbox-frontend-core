export const MINION_DETAILS_TAB_KEYS = [
  "dashboard",
  "job-returns",
  "grains",
  "pillars",
  "extra-data",
  "terminal",
] as const;

export type BuiltinMinionDetailsTabKey = (typeof MINION_DETAILS_TAB_KEYS)[number];

export type MinionDetailsTabKey = BuiltinMinionDetailsTabKey | (string & {});

export const DEFAULT_MINION_DETAILS_TAB: MinionDetailsTabKey = "dashboard";

export const MINION_DETAILS_DRAWER_TAB_KEYS = [
  "dashboard",
  "grains",
  "pillars",
  "extra-data",
  "terminal",
] as const satisfies readonly BuiltinMinionDetailsTabKey[];

export function getMinionDetailsTabKeys(
  isInDrawer: boolean
): readonly BuiltinMinionDetailsTabKey[] {
  return isInDrawer ? MINION_DETAILS_DRAWER_TAB_KEYS : MINION_DETAILS_TAB_KEYS;
}

export function parseMinionDetailsTabKey(
  value: string | null | undefined,
  isInDrawer: boolean,
  extraKeys: readonly string[] = []
): MinionDetailsTabKey {
  const allowed = getMinionDetailsTabKeys(isInDrawer);

  if (value && (allowed as readonly string[]).includes(value)) {
    return value;
  }

  if (value && extraKeys.includes(value)) {
    return value;
  }

  return DEFAULT_MINION_DETAILS_TAB;
}
