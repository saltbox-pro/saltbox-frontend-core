import { EMPTY_VALUE } from "@saltbox/saltbox-frontend-common";
import { Skeleton, Typography } from "antd";

import type { MinionCollectionsTreeStore } from "../../store/minion-collections-tree-store";

import { MinionCollectionsManySummary } from "./minion-collections-many-summary";
import { MinionCollectionsSingleSummary } from "./minion-collections-single-summary";

interface MinionCollectionsSectionProps {
  minionInnerId: string;
  collectionsCount?: number | null;
  collectionsTreeStore: MinionCollectionsTreeStore;
  activeCollectionSlug?: string;
  onOpenCollection?: (slug: string) => void;
}

export function MinionCollectionsSection({
  minionInnerId,
  collectionsCount,
  collectionsTreeStore,
  activeCollectionSlug,
  onOpenCollection,
}: MinionCollectionsSectionProps) {
  if (collectionsCount == null) {
    return <Skeleton.Input active size="small" />;
  }

  if (collectionsCount === 0) {
    return <Typography.Text type="secondary">{EMPTY_VALUE}</Typography.Text>;
  }

  if (collectionsCount === 1) {
    return (
      <MinionCollectionsSingleSummary
        minionInnerId={minionInnerId}
        collectionsTreeStore={collectionsTreeStore}
        activeCollectionSlug={activeCollectionSlug}
        onOpenCollection={onOpenCollection}
      />
    );
  }

  return (
    <MinionCollectionsManySummary
      minionInnerId={minionInnerId}
      collectionsCount={collectionsCount}
      collectionsTreeStore={collectionsTreeStore}
      activeCollectionSlug={activeCollectionSlug}
      onOpenCollection={onOpenCollection}
    />
  );
}
