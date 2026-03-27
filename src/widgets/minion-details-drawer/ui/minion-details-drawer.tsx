import type { MinionDetailSchema } from "@saltbox/saltbox-core-api-client";

import { BaseMinionDrawer } from "saltbox-core/shared/components/minion-base-drawer";
import {
  MinionDetails,
  type MinionDetailsProps,
} from "saltbox-core/shared/components/minion-details/minion-details";

interface MinionDetailsDrawerProps {
  error: string | null | undefined;
  minion: MinionDetailSchema | null | undefined;
  isMinionLoading?: boolean;
  isOpened: boolean;
  openedMinionId?: string | null;
  openedInnerId?: string | null;
  slug: string | null | undefined;
  onClose: () => void;
  clearData: () => void;
  mask?: boolean;
  onFilterButton?: MinionDetailsProps["onFilterButton"];
}

export function MinionDetailsDrawer({
  error,
  minion,
  isMinionLoading,
  isOpened,
  openedMinionId,
  openedInnerId,
  slug,
  onFilterButton,
  onClose,
  clearData,
  mask,
}: MinionDetailsDrawerProps) {
  const { id: minionInnerId, minion_id: minionDisplayId } = minion ?? {};
  const resolvedInnerId = minionInnerId ?? openedInnerId ?? "";
  const resolvedDisplayId = minionDisplayId ?? openedMinionId ?? "";

  const hasData = Boolean(minion?.id) && !error;

  return (
    <BaseMinionDrawer
      id={resolvedDisplayId}
      innerId={resolvedInnerId}
      slug={slug}
      open={isOpened}
      loading={!!isMinionLoading}
      hasData={hasData}
      errorMessage={error}
      mask={mask}
      onClose={onClose}
      onAfterClose={clearData}
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
