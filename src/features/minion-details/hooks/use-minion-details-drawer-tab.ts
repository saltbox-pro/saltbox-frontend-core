import { useEffect, useState } from "react";

import { DEFAULT_MINION_DETAILS_TAB, type MinionDetailsTabKey } from "../model/tabs";

export function useMinionDetailsDrawerTab(isDrawerOpen: boolean) {
  const [drawerTab, setDrawerTab] = useState<MinionDetailsTabKey>(DEFAULT_MINION_DETAILS_TAB);

  useEffect(() => {
    if (!isDrawerOpen) {
      setDrawerTab(DEFAULT_MINION_DETAILS_TAB);
    }
  }, [isDrawerOpen]);

  return { tabKey: drawerTab, onTabChange: setDrawerTab };
}
