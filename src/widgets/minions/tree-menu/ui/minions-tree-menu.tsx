import { DownOutlined } from "@ant-design/icons";
import { Alert, Flex, Spin, Tree } from "antd";
import { observer } from "mobx-react-lite";
import { type Key, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router";

import { collectionsTreeStore } from "saltbox-core/store/collections-tree-store";

import { buildHighlightedNode } from "../helpers/build-highlighted-tree";
import { collectExpandedKeys } from "../helpers/collect-expanded-keys";
import { collectMatchedKeys } from "../helpers/collect-matched-keys";
import { filterTree } from "../helpers/filter-tree";
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
  const savedExpandedKeys = useRef<Key[]>([]);
  const prevSearch = useRef<string>("");

  const navigate = useNavigate();
  const location = useLocation();
  const pathnameRef = useRef(location.pathname);

  const activeSlug = useMemo(
    () => pathnameRef.current.match(/^\/core\/minions\/([^/]+)/)?.[1] ?? null,
    []
  );

  const treeData = useMemo(
    () => collectionsTreeStore.treeNodes.map(mapToAntdNode),
    [collectionsTreeStore.treeNodes]
  );
  const activePath = useMemo(
    () => (activeSlug ? findNodePath(treeData, activeSlug) : null),
    [treeData, activeSlug]
  );

  const selectedKeys = useMemo(() => (activePath ? [activePath.nodeKey] : []), [activePath]);

  const defaultExpandedKeys = useMemo(() => {
    if (treeData.length === 0) return [];
    const firstLevelKeys = treeData.map((node) => node.key);
    const ancestorKeys = activePath?.ancestorKeys ?? [];
    return Array.from(new Set([...firstLevelKeys, ...ancestorKeys]));
  }, [treeData, activePath]);

  const displayData = useMemo(() => {
    const filtered = filterTree(treeData, appliedSearch);
    return filtered ?? treeData;
  }, [treeData, appliedSearch]);

  const matchedKeys = useMemo(
    () => collectMatchedKeys(displayData, appliedSearch),
    [displayData, appliedSearch]
  );

  const highlightedTreeData = useMemo(() => {
    if (!appliedSearch) return displayData;
    return displayData.map((node) => buildHighlightedNode(node, appliedSearch, matchedKeys));
  }, [displayData, appliedSearch, matchedKeys]);

  const noResults = appliedSearch.length > 0 && displayData.length === 0;

  useEffect(() => {
    collectionsTreeStore.loadTree();
  }, []);

  useEffect(() => {
    if (treeData.length > 0 && !initialExpandDone.current) {
      initialExpandDone.current = true;
      setExpandedKeys(defaultExpandedKeys);
    }
  }, [treeData.length, defaultExpandedKeys]);

  useEffect(() => {
    const wasSearching = !!prevSearch.current;
    const isSearching = !!appliedSearch;

    if (isSearching && !wasSearching) {
      savedExpandedKeys.current = expandedKeys;
    }

    if (isSearching) {
      const keys = collectExpandedKeys(displayData, matchedKeys);
      setExpandedKeys((prev) => {
        if (prev.length === keys.length && prev.every((k, i) => k === keys[i])) {
          return prev;
        }
        return keys;
      });
      setAutoExpandParent(true);
    } else if (!isSearching && wasSearching) {
      setExpandedKeys(savedExpandedKeys.current);
      setAutoExpandParent(false);
    }

    prevSearch.current = appliedSearch;
  }, [appliedSearch, displayData, matchedKeys]);

  const onSelect = useCallback(
    (_: Key[], info: { node: CollectionTreeAntdNode }) => {
      const slug = info.node.slug;
      if (slug) {
        navigate(`/core/minions/${slug}`);
        onClose();
      }
    },
    [navigate, onClose]
  );

  const onExpand = useCallback((newExpandedKeys: Key[]) => {
    setExpandedKeys(newExpandedKeys);
    setAutoExpandParent(false);
  }, []);

  const handleSearchChange = useCallback((search: string) => {
    setAppliedSearch(search);
  }, []);

  return (
    <Flex className={styles.minionsTreeMenu} vertical flex="1" gap="middle">
      <Flex className={styles.minionsTreeMenuHeader} gap="small" align="center">
        <MinionsTreeSearch
          disabled={!!collectionsTreeStore.error}
          onSearchChange={handleSearchChange}
        />
        <MinionsTreeRefreshButton />
      </Flex>

      <Spin
        wrapperClassName={styles.minionsTreeMenuContent}
        spinning={collectionsTreeStore.fetchTreeStatus === "in-process"}
      >
        {collectionsTreeStore.fetchTreeStatus === "error" && collectionsTreeStore.error ? (
          <Alert
            description={
              collectionsTreeStore.error.startsWith("collection.")
                ? t(collectionsTreeStore.error)
                : collectionsTreeStore.error
            }
            type="error"
          />
        ) : noResults ? (
          <div className={styles.searchEmptyState}>
            {t("collection.search-no-results", { search: appliedSearch })}
          </div>
        ) : (
          <Tree
            className={styles.minionsTree}
            showLine
            switcherIcon={<DownOutlined />}
            selectable
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
