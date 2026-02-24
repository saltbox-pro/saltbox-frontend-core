import { PillarTgtType } from "@saltbox/saltbox-core-api-client";
import { Flex } from "antd";
import { useEffect, useMemo } from "react";

import { useCreatePillar } from "saltbox-core/features/create-pillar";
import { PillarsTable } from "saltbox-core/shared/components/pillars/table";
import { PillarsStore } from "saltbox-core/store";

import styles from "./minion-pillars-tab.module.css";

interface MinionPillarsTabProps {
  targetId: string;
  targetName?: string;
  isFullView?: boolean;
  isInDrawer?: boolean;
}

export function MinionPillarsTab({
  targetId,
  targetName,
  isFullView = false,
  isInDrawer = false,
}: MinionPillarsTabProps) {
  const pillarsStore = useMemo(() => new PillarsStore({ targetId }), [targetId]);
  const displayName = targetName ?? targetId;

  const { addPillarButton, createPillarModal } = useCreatePillar({
    store: pillarsStore,
    targetType: PillarTgtType.Minion,
    tgtId: targetId,
    targetName: displayName,
  });

  useEffect(() => {
    if (!pillarsStore) return;
    pillarsStore.loadPillars();

    return () => pillarsStore.reset();
  }, [pillarsStore]);

  return (
    <Flex className={styles.pillarsTabContent} vertical flex={1}>
      {isFullView && <div className="page-actions-buttons">{addPillarButton}</div>}

      {!!pillarsStore && (
        <PillarsTable
          store={pillarsStore}
          hideTargetColumns={isInDrawer}
          hideDateColumns={isInDrawer}
        />
      )}

      {createPillarModal}
    </Flex>
  );
}
