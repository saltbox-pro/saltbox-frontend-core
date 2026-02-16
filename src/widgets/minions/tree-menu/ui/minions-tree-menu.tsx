import { Alert, Flex, message, Spin, Tree } from "antd";
import { observer } from "mobx-react-lite";
import { type Key, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router";

import { collectionsTreeStore } from "saltbox-core/store/collections-tree-store";

import { findNodePath } from "../helpers/find-node-path";
import { mapToAntdNode } from "../helpers/map-to-ant-node";
import type { CollectionTreeAntdNode } from "../types/node";

import styles from "./minions-tree-menu.module.css";
import { MinionsTreeRefreshButton } from "./minions-tree-refresh-button";
import { MinionsTreeSearch } from "./minions-tree-search";

interface MinionsTreeMenuProps {
  onClose: () => void;
}

export const MinionsTreeMenu = observer(({ onClose }: MinionsTreeMenuProps) => {
  const { t } = useTranslation();
  const [appliedSearch, setAppliedSearch] = useState<string>("");
  const [expandedKeys, setExpandedKeys] = useState<Key[]>([]);
  const [autoExpandParent, setAutoExpandParent] = useState<boolean>(false);
  const initialExpandDone = useRef<boolean>(false);
  const navigate = useNavigate();
  const location = useLocation();

  const activeSlug = location.pathname.match(/^\/core\/minions\/([^/]+)/)?.[1] ?? null;
  const treeData = collectionsTreeStore.treeNodes.map(mapToAntdNode);
  const activePath = activeSlug ? findNodePath(treeData, activeSlug) : null;
  const selectedKeys = activePath ? [activePath.nodeKey] : [];

  const defaultExpandedKeys = useMemo(() => {
    if (treeData.length === 0) return [];
    const firstLevelKeys = treeData.map((node) => node.key);
    const ancestorKeys = activePath?.ancestorKeys ?? [];
    return Array.from(new Set([...firstLevelKeys, ...ancestorKeys]));
  }, [treeData, activePath]);

  const highlightedTreeData = useMemo(() => {
    if (!appliedSearch) return treeData;

    const loop = (nodes: CollectionTreeAntdNode[]): CollectionTreeAntdNode[] =>
      nodes.map((item) => {
        const strTitle = String(item.title ?? "");
        const index = strTitle.toLowerCase().indexOf(appliedSearch);
        const title =
          index > -1 ? (
            <span>
              {strTitle.substring(0, index)}
              <span className={styles.searchHighlight}>
                {strTitle.substring(index, index + appliedSearch.length)}
              </span>
              {strTitle.substring(index + appliedSearch.length)}
            </span>
          ) : (
            strTitle
          );

        return {
          ...item,
          title,
          children: item.children ? loop(item.children) : undefined,
        };
      });

    return loop(treeData);
  }, [treeData, appliedSearch]);

  useEffect(() => {
    collectionsTreeStore.loadTree();
  }, []);

  useEffect(() => {
    if (treeData.length > 0 && !initialExpandDone.current) {
      initialExpandDone.current = true;
      setExpandedKeys(defaultExpandedKeys);
    }
  }, [treeData.length, defaultExpandedKeys]);

  const onSelect = (_: Key[], info: { node: CollectionTreeAntdNode }) => {
    const slug = info.node.slug;
    if (slug) {
      navigate(`/core/minions/${slug}`);
      onClose();
    }
  };

  const onExpand = (newExpandedKeys: Key[]) => {
    setExpandedKeys(newExpandedKeys);
    setAutoExpandParent(false);
  };

  const handleAppliedSearchChange = useCallback(
    (applied: string, keys: Key[]) => {
      setAppliedSearch(applied);
      if (applied.length === 0 || keys.length > 0) {
        setExpandedKeys(keys);
      } else {
        message.info(t("collection.search-no-matches"));
      }
      setAutoExpandParent(applied.length > 0);
    },
    [t]
  );

  return (
    <Flex className={styles.minionsTreeMenu} vertical flex="1" gap="middle">
      <Flex className={styles.minionsTreeMenuHeader} gap="small" align="center">
        <MinionsTreeSearch
          disabled={!!collectionsTreeStore.error}
          treeData={treeData}
          defaultExpandedKeys={defaultExpandedKeys}
          onAppliedSearchChange={handleAppliedSearchChange}
        />

        <MinionsTreeRefreshButton />
      </Flex>

      <Spin
        wrapperClassName={styles.minionsTreeMenuContent}
        spinning={collectionsTreeStore.isTreeLoading}
      >
        {collectionsTreeStore.error ? (
          <Alert
            description={
              collectionsTreeStore.error.startsWith("collection.")
                ? t(collectionsTreeStore.error)
                : collectionsTreeStore.error
            }
            type="error"
          />
        ) : (
          <Tree
            blockNode
            treeData={highlightedTreeData}
            expandedKeys={expandedKeys}
            selectedKeys={selectedKeys}
            autoExpandParent={autoExpandParent}
            onExpand={onExpand}
            onSelect={onSelect}
          />
        )}
      </Spin>
    </Flex>
  );
});
