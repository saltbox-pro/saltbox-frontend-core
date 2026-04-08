import { BaseMinionDrawer } from "saltbox-core/shared/components/minion-base-drawer";
import {
  MinionDetails,
  type MinionDetailsProps,
} from "saltbox-core/shared/components/minion-details/minion-details";

import { useMinionDetailsDrawer } from "../hooks/use-minion-details-drawer";
import type { MinionDetailsDrawerOpenParams } from "../types";

interface MinionDetailsDrawerProps {
  drawer: {
    isOpened: boolean;
    openedArg: MinionDetailsDrawerOpenParams | null;
    close: () => void;
  };
  mask?: boolean;
  onFilterButton?: MinionDetailsProps["onFilterButton"];
}

export function MinionDetailsDrawer({ drawer, onFilterButton, mask }: MinionDetailsDrawerProps) {
  const { minion, isMinionLoading, error, hasData, slug, resolvedDisplayId, resolvedInnerId } =
    useMinionDetailsDrawer({ isOpened: drawer.isOpened, openedArg: drawer.openedArg });

  return (
    <BaseMinionDrawer
      id={resolvedDisplayId}
      innerId={resolvedInnerId}
      slug={slug}
      open={drawer.isOpened}
      loading={!!isMinionLoading}
      hasData={hasData}
      errorMessage={error}
      mask={mask}
      transitionKey={minion?.minion_id}
      onClose={drawer.close}
    >
      <MinionDetails
        isInDrawer
        minion={minion}
        isMinionLoading={false}
        onFilterButton={onFilterButton}
      />
    </BaseMinionDrawer>
  );
}
