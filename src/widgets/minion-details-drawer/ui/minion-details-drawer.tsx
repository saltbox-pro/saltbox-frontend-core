import { observer } from "mobx-react-lite";

import { BaseMinionDrawer } from "saltbox-core/shared/components/minion-base-drawer";
import {
  MinionDetails,
  type MinionDetailsProps,
} from "saltbox-core/shared/components/minion-details/minion-details";
import type { MinionStore } from "saltbox-core/store";

interface MinionDetailsDrawerProps {
  minionStore: MinionStore | null | undefined;
  error: string | null | undefined;
  isOpened: boolean;
  openedId: string | null | undefined;
  slug: string | null | undefined;
  onClose: () => void;
  clearData: () => void;
  onFilterButton?: MinionDetailsProps["onFilterButton"];
}

export const MinionDetailsDrawer = observer<MinionDetailsDrawerProps>(function MinionDetailsDrawer({
  minionStore,
  error,
  isOpened,
  openedId,
  slug,
  onFilterButton,
  onClose,
  clearData,
}) {
  const {
    minion,
    isMinionLoading,
    pillars,
    isPillarsLoading,
    error: errorFromStore,
  } = minionStore ?? {};
  const { id: minionInnerId, minion_id: minionId = openedId } = minion ?? {};

  const isWaitingForStore = !!openedId && !minionStore && !error;
  const isLoading = isWaitingForStore || !!isMinionLoading || !!isPillarsLoading;

  const hasData = Boolean(minion && !error && !errorFromStore);

  return (
    <BaseMinionDrawer
      id={minionId}
      innerId={minionInnerId}
      slug={slug}
      open={isOpened}
      isLoading={isLoading}
      hasData={hasData}
      error={error || errorFromStore}
      onClose={onClose}
      onAfterClose={clearData}
    >
      <MinionDetails
        isInDrawer
        minion={minion}
        isMinionLoading={isMinionLoading}
        pillars={pillars}
        isPillarsLoading={isPillarsLoading}
        onFilterButton={onFilterButton}
      />
    </BaseMinionDrawer>
  );
});
