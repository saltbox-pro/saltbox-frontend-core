import { PillarTgtType } from "@saltbox/saltbox-core-api-client";
import { Flex } from "antd";
import { useEffect, useMemo } from "react";

import { CreatePillar } from "saltbox-core/features/pillar/create-pillar";
import { PillarsTable } from "saltbox-core/shared/components/pillars/table";
import { PillarsStore } from "saltbox-core/store";

import styles from "./minion-pillars-tab.module.css";

interface MinionPillarsTabProps {
  targetId: string;
  targetName?: string;
  isInDrawer?: boolean;
}

export function MinionPillarsTab({
  targetId,
  targetName,
  isInDrawer = false,
}: MinionPillarsTabProps) {
  const pillarsStore = useMemo(() => new PillarsStore({ targetId }), [targetId]);

  const displayName = targetName ?? targetId;

  useEffect(() => {
    pillarsStore.loadPillars();

    return () => pillarsStore.reset();
  }, [pillarsStore]);

  return (
    <Flex className={styles.pillarsTabContent} vertical flex={1}>
      <div className="page-actions-buttons">
        <CreatePillar
          targetType={PillarTgtType.Minion}
          tgtId={targetId}
          targetName={displayName}
          loadPillars={pillarsStore.reloadFromFirstPage}
        />
      </div>

      <PillarsTable
        store={pillarsStore}
        hideTargetColumns={isInDrawer}
        hideDateColumns={isInDrawer}
      />
    </Flex>
  );
}
