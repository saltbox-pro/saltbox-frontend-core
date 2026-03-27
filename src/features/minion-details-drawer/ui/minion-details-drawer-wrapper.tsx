import { useCallback, useEffect } from "react";

import {
  MinionDetailsDrawer,
  useMinionDetailsDrawer,
} from "saltbox-core/widgets/minion-details-drawer";

import type { MinionDetailsDrawerWrapperProps } from "../types/types";

export function MinionDetailsDrawerWrapper({
  minionId,
  master,
  onFilterButton,
  onClose,
}: MinionDetailsDrawerWrapperProps) {
  const minionDrawer = useMinionDetailsDrawer();

  useEffect(() => {
    minionDrawer.open({ masterId: master, minionId });
  }, [minionId, master]);

  const handleAfterClose = useCallback(() => {
    minionDrawer.clearData();
    onClose?.();
  }, [minionDrawer.clearData, onClose]);

  return (
    <MinionDetailsDrawer
      isOpened={minionDrawer.isOpened}
      openedMinionId={minionDrawer.openedMinionId}
      openedInnerId={minionDrawer.openedInnerId}
      minion={minionDrawer.minion}
      isMinionLoading={minionDrawer.isMinionLoading}
      slug={minionDrawer.slug}
      error={minionDrawer.error}
      onClose={minionDrawer.close}
      clearData={handleAfterClose}
      mask
      onFilterButton={onFilterButton}
    />
  );
}
