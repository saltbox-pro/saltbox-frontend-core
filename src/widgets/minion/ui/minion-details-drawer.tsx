import { Drawer } from "@saltbox/saltbox-frontend-common";
import { observer } from "mobx-react-lite";
import { type ReactNode, useEffect } from "react";

import {
  MinionDetails,
  type MinionDetailsProps,
} from "saltbox-core/shared/components/minion-details/minion-details";
import type { MinionStore } from "saltbox-core/store";

import { MinionDetailsDrawerError } from "./minion-details-drawer-error";
import { MinionDetailsDrawerLink } from "./minion-details-drawer-link";
import { MinionDetailsDrawerLoader } from "./minion-details-drawer-loader";
import { MinionDetailsDrawerTitle } from "./minion-details-drawer-title";

interface MinionDetailsDrawerProps {
  minionStore: MinionStore | null;
  error?: string | null;
  isOpened: boolean;
  openedId: string;
  slug?: string | null;
  onFilterButton?: MinionDetailsProps["onFilterButton"];
  onClose: () => void;
  clearData: () => void;
  extra?: ReactNode;
}

export const MinionDetailsDrawer = observer(function MinionDetailsDrawer({
  minionStore,
  error,
  isOpened,
  openedId,
  slug,
  onFilterButton,
  onClose,
  clearData,
  extra,
}: MinionDetailsDrawerProps) {
  const {
    minion,
    isMinionLoading,
    pillars,
    isPillarsLoading,
    error: errorFromStore,
  } = minionStore ?? {};
  const { id: minionId, minion_id: minionName = openedId } = minion ?? {};

  const isWaitingForStore = !!openedId && !minionStore && !error;
  const isLoading = isWaitingForStore || !!isMinionLoading || !!isPillarsLoading;

  const errorMessage = error || errorFromStore;
  const hasError = Boolean(errorMessage);
  const hasData = Boolean(minion && !hasError);

  const handleAfterOpenChange = (open: boolean) => {
    if (!open) {
      clearData();
    }
  };

  useEffect(() => {
    return () => {
      onClose();
      clearData();
    };
  }, [clearData, onClose]);

  return (
    <Drawer
      open={isOpened}
      onClose={onClose}
      size="large"
      title={<MinionDetailsDrawerTitle id={minionName} />}
      afterOpenChange={handleAfterOpenChange}
      extra={extra ?? (!!minionId && <MinionDetailsDrawerLink slug={slug} id={minionId} />)}
    >
      {isLoading && <MinionDetailsDrawerLoader />}

      {hasData && !isLoading ? (
        <MinionDetails
          isInDrawer
          minion={minion}
          isMinionLoading={isMinionLoading}
          pillars={pillars}
          isPillarsLoading={isPillarsLoading}
          onFilterButton={onFilterButton}
        />
      ) : (
        hasError && <MinionDetailsDrawerError message={errorMessage} />
      )}
    </Drawer>
  );
});
