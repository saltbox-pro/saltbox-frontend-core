import { EMPTY_VALUE, ErrorZone } from "@saltbox/saltbox-frontend-common";
import { Skeleton, Typography } from "antd";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useMemo } from "react";

import { findMinionMembershipCollection } from "../../helpers/find-minion-membership-collection";
import { getMinionCollectionNodeInteraction } from "../../helpers/minion-collection-tree-node";
import type { MinionCollectionsTreeStore } from "../../store/minion-collections-tree-store";

interface MinionCollectionsSingleSummaryProps {
  minionInnerId: string;
  collectionsTreeStore: MinionCollectionsTreeStore;
  activeCollectionSlug?: string;
  onOpenCollection?: (slug: string) => void;
}

export const MinionCollectionsSingleSummary = observer(function MinionCollectionsSingleSummary({
  minionInnerId,
  collectionsTreeStore,
  activeCollectionSlug,
  onOpenCollection,
}: MinionCollectionsSingleSummaryProps) {
  useEffect(() => {
    collectionsTreeStore.ensureLoaded(minionInnerId);
  }, [collectionsTreeStore, minionInnerId]);

  const isTreeReady = collectionsTreeStore.isReadyFor(minionInnerId);

  const singleCollection = useMemo(() => {
    if (!isTreeReady) {
      return undefined;
    }

    return findMinionMembershipCollection(collectionsTreeStore.treeNodes);
  }, [isTreeReady, collectionsTreeStore.treeNodes]);

  const singleInteraction = singleCollection
    ? getMinionCollectionNodeInteraction(singleCollection, activeCollectionSlug)
    : undefined;

  const handleOpenSingleCollection = useCallback(() => {
    if (!singleCollection) {
      return;
    }

    onOpenCollection?.(singleCollection.slug);
  }, [singleCollection, onOpenCollection]);

  return (
    <ErrorZone level="block" loaders={[collectionsTreeStore.treeLoad]}>
      {!isTreeReady && <Skeleton.Input active size="small" />}
      {isTreeReady && !singleCollection && (
        <Typography.Text type="secondary">{EMPTY_VALUE}</Typography.Text>
      )}
      {singleCollection && singleInteraction === "openable" && (
        <Typography.Link onClick={handleOpenSingleCollection}>
          {singleCollection.title}
        </Typography.Link>
      )}
      {singleCollection && singleInteraction === "active" && singleCollection.title}
      {singleCollection && singleInteraction === "muted" && (
        <Typography.Text type="secondary">{singleCollection.title}</Typography.Text>
      )}
    </ErrorZone>
  );
});
