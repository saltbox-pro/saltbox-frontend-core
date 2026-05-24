import { useMinionDetailsUrlTab } from "../hooks/use-minion-details-url-tab";
import type { MinionDetailsCommonProps } from "../types/minion-details-props";

import { MinionDetailsTabsView } from "./components/minion-details-tabs-view";

export type MinionDetailsFullPageProps = MinionDetailsCommonProps;

export function MinionDetailsFullPage(props: MinionDetailsFullPageProps) {
  const { tabKey, onTabChange } = useMinionDetailsUrlTab();

  return (
    <MinionDetailsTabsView
      isInDrawer={false}
      tabKey={tabKey}
      onTabChange={onTabChange}
      {...props}
    />
  );
}
