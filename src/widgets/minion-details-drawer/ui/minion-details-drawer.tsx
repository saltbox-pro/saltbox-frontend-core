import { observer } from "mobx-react-lite";

import {
  MinionDetailActionsMenu,
  MinionDetailsInDrawer,
  type OnFilterButtonHandler,
  useMinionDetailsDrawerTab,
} from "saltbox-core/features/minion-details";
import { BaseMinionDrawer } from "saltbox-core/shared/components/minion-base-drawer";

import { useMinionDetailsDrawer } from "../hooks/use-minion-details-drawer";
import type { MinionDetailsDrawerOpenParams } from "../types";

interface MinionDetailsDrawerProps {
  drawer: {
    isOpened: boolean;
    openedArg: MinionDetailsDrawerOpenParams | null;
    close: () => void;
  };
  mask?: boolean;
  onFilterButton?: OnFilterButtonHandler;
}

export const MinionDetailsDrawer = observer(function MinionDetailsDrawer({
  drawer,
  onFilterButton,
  mask,
}: MinionDetailsDrawerProps) {
  const {
    minion,
    isMinionLoading,
    isMinionRefreshing,
    minionLoad,
    hasData,
    slug,
    resolvedDisplayId,
    resolvedInnerId,
  } = useMinionDetailsDrawer({ isOpened: drawer.isOpened, openedArg: drawer.openedArg });

  const { tabKey, onTabChange } = useMinionDetailsDrawerTab(drawer.isOpened);

  return (
    <BaseMinionDrawer
      id={resolvedDisplayId}
      innerId={resolvedInnerId}
      slug={slug}
      activeTab={tabKey}
      open={drawer.isOpened}
      loading={!!isMinionLoading}
      hasData={hasData}
      loaders={[minionLoad]}
      mask={mask}
      transitionKey={minion?.minion_id}
      push={{ distance: tabKey === "extra-data" ? 370 : 180 }}
      linkPlacement="title"
      extra={
        <MinionDetailActionsMenu
          minion={minion}
          collectionSlug={slug}
          minionMongoId={resolvedInnerId}
          onDeleted={drawer.close}
        />
      }
      onClose={drawer.close}
    >
      <MinionDetailsInDrawer
        activeTab={tabKey}
        onActiveTabChange={onTabChange}
        minion={minion}
        isMinionLoading={false}
        isMinionRefreshing={isMinionRefreshing}
        onFilterButton={onFilterButton}
      />
    </BaseMinionDrawer>
  );
});
