import { PillarTgtType } from "@saltbox/saltbox-core-api-client";
import { Flex } from "antd";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo } from "react";

import { useCreatePillar } from "saltbox-core/features/create-pillar";
import { PillarsTable } from "saltbox-core/shared/components/pillars/table";
import { PillarsStore } from "saltbox-core/store";

interface MinionsPillarsViewProps {
  collectionId: string;
  collectionSlug: string;
  collectionName?: string;
}

export const MinionsPillarsView = observer(
  ({ collectionId, collectionSlug, collectionName }: MinionsPillarsViewProps) => {
    const pillarsStore = useMemo(
      () => new PillarsStore({ targetId: collectionId }),
      [collectionId]
    );

    const targetType =
      collectionSlug === PillarTgtType.Root ? PillarTgtType.Root : PillarTgtType.Collection;
    const targetName = collectionName ?? collectionSlug;

    const { addPillarButton, createPillarModal } = useCreatePillar({
      store: pillarsStore,
      targetType,
      tgtId: collectionId,
      targetName,
    });

    useEffect(() => {
      if (!pillarsStore) return;
      pillarsStore.loadPillars();

      return () => pillarsStore.reset();
    }, [pillarsStore]);

    return (
      <Flex vertical flex={1}>
        <div className="page-actions-buttons">{addPillarButton}</div>

        <PillarsTable store={pillarsStore} />

        {createPillarModal}
      </Flex>
    );
  }
);
