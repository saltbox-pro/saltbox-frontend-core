import { useEffect } from "react";

import {
  isMinionNeverActive,
  type MinionActivity,
} from "saltbox-core/shared/helpers/minion-activity";

import { type MinionDetailsTabKey, resolveMinionDetailsTabKey } from "../model/tabs";

export function useResolvedMinionDetailsTab(
  tabKey: MinionDetailsTabKey,
  minion: MinionActivity | null | undefined,
  onResolve: (key: MinionDetailsTabKey) => void
): MinionDetailsTabKey {
  const resolvedTabKey = resolveMinionDetailsTabKey(tabKey, isMinionNeverActive(minion));

  useEffect(() => {
    if (resolvedTabKey !== tabKey) {
      onResolve(resolvedTabKey);
    }
  }, [onResolve, resolvedTabKey, tabKey]);

  return resolvedTabKey;
}
