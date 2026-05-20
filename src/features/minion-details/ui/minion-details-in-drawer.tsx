import type { MinionDetailsTabKey } from "../model/tabs";
import type { MinionDetailsCommonProps } from "../types/minion-details-props";

import { MinionDetailsTabsView } from "./components/minion-details-tabs-view";

export interface MinionDetailsInDrawerProps extends MinionDetailsCommonProps {
  activeTab: MinionDetailsTabKey;
  onActiveTabChange: (key: MinionDetailsTabKey) => void;
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
