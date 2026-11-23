import { observer } from "mobx-react-lite";

import { useMinionDetailsUrlTab } from "../hooks/use-minion-details-url-tab";
import type { MinionDetailsCommonProps } from "../types/minion-details-props";

import { MinionDetailsTabsView } from "./components/minion-details-tabs-view";

export type MinionDetailsFullPageProps = MinionDetailsCommonProps;

export const MinionDetailsFullPage = observer(function MinionDetailsFullPage(
  props: MinionDetailsFullPageProps
) {
  const { tabKey, onTabChange } = useMinionDetailsUrlTab(props.minion);

  return (
    <MinionDetailsTabsView
      isInDrawer={false}
      tabKey={tabKey}
      onTabChange={onTabChange}
      {...props}
    />
  );
});
