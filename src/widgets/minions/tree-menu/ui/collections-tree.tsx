import { DownOutlined } from "@ant-design/icons";
import { SearchInput } from "@saltbox/saltbox-frontend-common";
import { Alert, Empty, Flex, Spin, Tree, Typography } from "antd";
import clsx from "clsx";
import { observer } from "mobx-react-lite";
import { type Key, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router";

import { collectionsTreeStore } from "saltbox-core/store/collections-tree-store";

import { buildHighlightedNode } from "../helpers/build-highlighted-tree";
import { collectExpandedKeys } from "../helpers/collect-expanded-keys";
import { collectMatchedKeys } from "../helpers/collect-matched-keys";
import { filterTree } from "../helpers/filter-tree";
import { findNodePath } from "../helpers/find-node-path";
import { mapToAntdNode } from "../helpers/map-to-ant-node";
import type { CollectionTreeAntdNode } from "../types/node";

import styles from "./collections-tree.module.css";
import { MinionsTreeRefreshButton } from "./minions-tree-refresh-button";

const ROOT_SLUG = "root";

interface CollectionsTreeProps {
  onSelectNode: (node: CollectionTreeAntdNode) => void;
  renderActions?: (node: CollectionTreeAntdNode) => ReactNode;
  showDescription?: boolean;
  compact?: boolean;
  className?: string;
}

export const CollectionsTree = observer(
  ({
    onSelectNode,
    renderActions,
    showDescription = false,
    compact = false,
    className,
  }: CollectionsTreeProps) => {
    const { t } = useTranslation();

    const [appliedSearchQuery, setAppliedSearchQuery] = useState<string>("");
    const [expandedKeys, setExpandedKeys] = useState<Key[]>([]);
    const [autoExpandParent, setAutoExpandParent] = useState<boolean>(false);

    const initialExpandDone = useRef<boolean>(false);
    const savedExpandedKeys = useRef<Key[]>([]);
    const prevSearch = useRef<string>("");

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
      const filtered = filterTree(treeData, appliedSearchQuery);
      return filtered ?? treeData;
    }, [treeData, appliedSearchQuery]);

    const matchedKeys = useMemo(
      () => collectMatchedKeys(displayData, appliedSearchQuery),
      [displayData, appliedSearchQuery]
    );

    const highlightedTreeData = useMemo(() => {
      if (!appliedSearchQuery) return displayData;
      return displayData.map((node) => buildHighlightedNode(node, appliedSearchQuery, matchedKeys));
    }, [displayData, appliedSearchQuery, matchedKeys]);

    const noResults = appliedSearchQuery.length > 0 && displayData.length === 0;

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
      const isSearching = !!appliedSearchQuery;

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

      prevSearch.current = appliedSearchQuery;
    }, [appliedSearchQuery, displayData, matchedKeys]);

    const onSelect = useCallback(
      (_: Key[], info: { node: CollectionTreeAntdNode }) => {
        onSelectNode(info.node);
      },
      [onSelectNode]
    );

    const onExpand = useCallback((newExpandedKeys: Key[]) => {
      setExpandedKeys(newExpandedKeys);
      setAutoExpandParent(false);
    }, []);

    const handleSearchChange = useCallback((search: string) => {
      setAppliedSearchQuery(search);
    }, []);

    const titleRender = useMemo(() => {
      if (!renderActions && !showDescription) return undefined;
      return (node: CollectionTreeAntdNode) => (
        <Flex className={styles.nodeRow} align="center" gap="small">
          <span className={styles.nodeTitle}>{node.title as ReactNode}</span>
          {showDescription &&
            node.slug !== ROOT_SLUG &&
            (node.description ? (
              <Typography.Text
                type="secondary"
                className={styles.nodeDescription}
                ellipsis={{ tooltip: node.description }}
              >
                {node.description}
              </Typography.Text>
            ) : (
              <Typography.Text type="secondary" italic className={styles.nodeDescription}>
                {t("collection.no-description")}
              </Typography.Text>
            ))}
          {renderActions && <span className={styles.nodeActions}>{renderActions(node)}</span>}
        </Flex>
      );
    }, [renderActions, showDescription, t]);

    return (
      <Flex
        className={clsx(styles.collectionsTree, compact && styles.compact, className)}
        vertical
        flex="1"
        gap="middle"
      >
        <Flex className={styles.header} gap="small" align="center">
          <SearchInput
            disabled={!!collectionsTreeStore.error}
            autoFocus
            onSearch={handleSearchChange}
          />
          <MinionsTreeRefreshButton />
        </Flex>

        <Spin
          wrapperClassName={styles.content}
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
            <Empty
              className={styles.searchEmptyState}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={t("collection.search-no-results")}
            />
          ) : (
            <Tree
              className={styles.tree}
              showLine
              switcherIcon={<DownOutlined />}
              selectable
              blockNode
              treeData={highlightedTreeData}
              titleRender={titleRender}
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
  }
);
