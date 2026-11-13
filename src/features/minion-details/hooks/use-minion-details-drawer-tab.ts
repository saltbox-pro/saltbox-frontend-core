import { useEffect, useState } from "react";

import type { MinionActivityFlags } from "saltbox-core/shared/helpers/minion-activity";

import { DEFAULT_MINION_DETAILS_TAB, type MinionDetailsTabKey } from "../model/tabs";

import { useResolvedMinionDetailsTab } from "./use-resolved-minion-details-tab";

export function useMinionDetailsDrawerTab(
  isDrawerOpen: boolean,
  minion: MinionActivityFlags | null | undefined
) {
  const [drawerTab, setDrawerTab] = useState<MinionDetailsTabKey>(DEFAULT_MINION_DETAILS_TAB);

  useEffect(() => {
    if (!isDrawerOpen) {
      setDrawerTab(DEFAULT_MINION_DETAILS_TAB);
    }
  }, [isDrawerOpen]);

  const tabKey = useResolvedMinionDetailsTab(drawerTab, minion, setDrawerTab);

  return { tabKey, onTabChange: setDrawerTab };
}
