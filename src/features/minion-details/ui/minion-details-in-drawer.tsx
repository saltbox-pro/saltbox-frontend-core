import type { MinionDetailsTabKey } from "../model/tabs";
import type { MinionCollectionsTreeStore } from "../store/minion-collections-tree-store";
import type { MinionDetailsCommonProps } from "../types/minion-details-props";

import { MinionDetailsTabsView } from "./components/minion-details-tabs-view";

export interface MinionDetailsInDrawerProps extends MinionDetailsCommonProps {
  activeTab: MinionDetailsTabKey;
  onActiveTabChange: (key: MinionDetailsTabKey) => void;
  collectionsTreeStore: MinionCollectionsTreeStore;
}

export function MinionDetailsInDrawer({
  activeTab,
  onActiveTabChange,
  ...props
}: MinionDetailsInDrawerProps) {
  return (
    <MinionDetailsTabsView
      isInDrawer
      tabKey={activeTab}
      onTabChange={onActiveTabChange}
      {...props}
    />
  );
}
