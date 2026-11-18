import { ErrorZone, Modal, SearchInput } from "@saltbox/saltbox-frontend-common";
import { Empty, Flex, Typography, type TreeProps } from "antd";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useMemo, useRef, useState, type Key } from "react";
import { useTranslation } from "react-i18next";

import {
  buildHighlightedCollectionTreeNode,
  collectCollectionTreeMatchedKeys,
  CollectionTreeNodeTitle,
  CollectionTreeView,
  filterCollectionTreeNodes,
  mapCollectionTreeNodes,
  withCollectionTreeSelectability,
  type CollectionTreeAntdNode,
} from "saltbox-core/shared/components/collection-tree";
import { findNodeBySlug, flattenTreeNodes } from "saltbox-core/shared/utils/tree-utils";

import { getMinionCollectionNodeInteraction } from "../../helpers/minion-collection-tree-node";
import type { MinionCollectionsTreeStore } from "../../store/minion-collections-tree-store";

import styles from "./minion-collections-many-summary.module.css";

interface MinionCollectionsManySummaryProps {
  minionInnerId: string;
  collectionsCount: number;
  collectionsTreeStore: MinionCollectionsTreeStore;
  activeCollectionSlug?: string;
  onOpenCollection?: (slug: string) => void;
}

export const MinionCollectionsManySummary = observer(function MinionCollectionsManySummary({
  minionInnerId,
  collectionsCount,
  collectionsTreeStore,
  activeCollectionSlug,
  onOpenCollection,
}: MinionCollectionsManySummaryProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedKeys, setExpandedKeys] = useState<Key[]>([]);
  const expandSeedQueryRef = useRef<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    collectionsTreeStore.ensureLoaded(minionInnerId);
  }, [open, collectionsTreeStore, minionInnerId]);

  const isTreeReady = collectionsTreeStore.isReadyFor(minionInnerId);

  const treeData = useMemo(() => {
    if (!isTreeReady) {
      return [];
    }

    return withCollectionTreeSelectability(
      mapCollectionTreeNodes(collectionsTreeStore.treeNodes),
      (node) => {
        const interaction = getMinionCollectionNodeInteraction(node, activeCollectionSlug);
        return {
          selectable: interaction === "openable",
          disabled: interaction === "muted",
        };
      }
    );
  }, [isTreeReady, collectionsTreeStore.treeNodes, activeCollectionSlug]);

  const displayTreeData = useMemo(() => {
    const filtered = filterCollectionTreeNodes(treeData, searchQuery) ?? treeData;
    if (!searchQuery.trim()) {
      return filtered;
    }

    const matchedKeys = collectCollectionTreeMatchedKeys(filtered, searchQuery);
    return filtered.map((node) =>
      buildHighlightedCollectionTreeNode(node, searchQuery, matchedKeys)
    );
  }, [treeData, searchQuery]);

  useEffect(() => {
    if (!open || !isTreeReady) {
      return;
    }

    if (expandSeedQueryRef.current === searchQuery) {
      return;
    }

    expandSeedQueryRef.current = searchQuery;
    setExpandedKeys(flattenTreeNodes(displayTreeData).map((node) => node.key));
  }, [open, searchQuery, displayTreeData, isTreeReady]);

  const selectedKeys = useMemo(() => {
    if (!activeCollectionSlug) {
      return [];
    }

    const key = findNodeBySlug(displayTreeData, activeCollectionSlug)?.key;
    return key != null ? [key] : [];
  }, [displayTreeData, activeCollectionSlug]);

  const handleAfterClose = useCallback(() => {
    setSearchQuery("");
    setExpandedKeys([]);
    expandSeedQueryRef.current = null;
  }, []);

  const handleTreeSelect = useCallback<NonNullable<TreeProps<CollectionTreeAntdNode>["onSelect"]>>(
    (_keys, info) => {
      if (!info.node.selectable) {
        return;
      }

      onOpenCollection?.(info.node.slug);
      setOpen(false);
    },
    [onOpenCollection]
  );

  const noSearchResults =
    isTreeReady && searchQuery.trim().length > 0 && displayTreeData.length === 0;

  return (
    <>
      <Typography.Link onClick={() => setOpen(true)}>{collectionsCount}</Typography.Link>

      <Modal
        title={t("minions.minion-collections")}
        open={open}
        onCancel={() => setOpen(false)}
        afterClose={handleAfterClose}
        footer={null}
        width="95vw"
        centered
        destroyOnHidden
        classNames={{
          wrapper: styles.modalWrapper,
          content: styles.modalContent,
          body: styles.modalBody,
        }}
      >
        <ErrorZone level="block" loaders={[collectionsTreeStore.treeLoad]}>
          <Flex vertical gap="middle" className={styles.modalInner}>
            <SearchInput autoFocus onSearch={setSearchQuery} />
            <div className={styles.modalTreeScroll}>
              {noSearchResults && (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={t("collection.search-no-results")}
                />
              )}
              {!noSearchResults && (
                <CollectionTreeView
                  key={minionInnerId}
                  nowrapTitles
                  treeClickableStyle={false}
                  loading={open && !isTreeReady}
                  treeData={displayTreeData}
                  titleRender={(node) => <CollectionTreeNodeTitle node={node} />}
                  selectedKeys={selectedKeys}
                  expandedKeys={expandedKeys}
                  onExpand={setExpandedKeys}
                  onSelect={handleTreeSelect}
                />
              )}
            </div>
          </Flex>
        </ErrorZone>
      </Modal>
    </>
  );
});
