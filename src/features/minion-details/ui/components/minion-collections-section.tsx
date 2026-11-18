import { ErrorZone } from "@saltbox/saltbox-frontend-common";
import { Typography, type TreeProps } from "antd";
import clsx from "clsx";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useMemo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import {
  CollectionTreeView,
  mapCollectionTreeNodes,
  withCollectionTreeSelectability,
  type CollectionTreeAntdNode,
} from "saltbox-core/shared/components/collection-tree";
import { findNodeBySlug } from "saltbox-core/shared/utils/tree-utils";

import { getMinionCollectionNodeInteraction } from "../../helpers/minion-collection-tree-node";
import type { MinionCollectionsTreeStore } from "../../store/minion-collections-tree-store";

import styles from "./minion-collections-section.module.css";

interface MinionCollectionsSectionProps {
  minionInnerId: string;
  collectionsTreeStore: MinionCollectionsTreeStore;
  activeCollectionSlug?: string;
  onOpenCollection?: (slug: string) => void;
}

export const MinionCollectionsSection = observer(function MinionCollectionsSection({
  minionInnerId,
  collectionsTreeStore,
  activeCollectionSlug,
  onOpenCollection,
}: MinionCollectionsSectionProps) {
  const { t } = useTranslation();

  useEffect(() => {
    collectionsTreeStore.ensureLoaded(minionInnerId);
  }, [collectionsTreeStore, minionInnerId]);

  const isReady = collectionsTreeStore.isReadyFor(minionInnerId);

  const treeData = useMemo(
    () =>
      withCollectionTreeSelectability(
        mapCollectionTreeNodes(collectionsTreeStore.treeNodes),
        (node) => getMinionCollectionNodeInteraction(node, activeCollectionSlug) === "openable",
        { clickableClassName: styles.clickableNode }
      ),
    [collectionsTreeStore.treeNodes, activeCollectionSlug]
  );

  const selectedKeys = useMemo(() => {
    if (!activeCollectionSlug) {
      return [];
    }

    const key = findNodeBySlug(treeData, activeCollectionSlug)?.key;
    return key != null ? [key] : [];
  }, [treeData, activeCollectionSlug]);

  const titleRender = useCallback(
    (node: CollectionTreeAntdNode): ReactNode => {
      const title = typeof node.title === "string" ? node.title : "";
      const interaction = getMinionCollectionNodeInteraction(node, activeCollectionSlug);

      return (
        <Typography.Text
          title={title}
          type={interaction === "muted" ? "secondary" : undefined}
          className={clsx(
            interaction !== "muted" && styles.linkTitle,
            interaction === "active" && styles.activeTitle
          )}
        >
          {title}
        </Typography.Text>
      );
    },
    [activeCollectionSlug]
  );

  const handleSelect = useCallback<NonNullable<TreeProps<CollectionTreeAntdNode>["onSelect"]>>(
    (_keys, info) => {
      if (!info.node.selectable) {
        return;
      }

      onOpenCollection?.(info.node.slug);
    },
    [onOpenCollection]
  );

  const isEmpty = isReady && treeData.length === 0;

  return (
    <ErrorZone level="block" loaders={[collectionsTreeStore.treeLoad]}>
      {isEmpty && (
        <Typography.Text type="secondary">{t("minions.minion-collections-empty")}</Typography.Text>
      )}
      {!isEmpty && (
        <div className={styles.treeScroll}>
          <CollectionTreeView
            key={minionInnerId}
            compact
            compactSkeleton
            nowrapTitles
            treeClickableStyle={false}
            loading={!isReady}
            treeData={treeData}
            titleRender={titleRender}
            selectedKeys={selectedKeys}
            onSelect={handleSelect}
            defaultExpandAll
          />
        </div>
      )}
    </ErrorZone>
  );
});
