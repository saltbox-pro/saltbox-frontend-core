import { ApartmentOutlined, DownOutlined, HolderOutlined } from "@ant-design/icons";
import { SearchInput } from "@saltbox/saltbox-frontend-common";
import {
  Alert,
  Button,
  Empty,
  Flex,
  Spin,
  Tooltip,
  Tree,
  type TreeProps,
  Typography,
  message,
} from "antd";
import clsx from "clsx";
import { observer } from "mobx-react-lite";
import {
  type Key,
  type ReactNode,
  type Ref,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router";

import { collectionsTreeStore } from "saltbox-core/store/collections-tree-store";

import { buildHighlightedNode } from "../helpers/build-highlighted-tree";
import { collectExpandedKeys } from "../helpers/collect-expanded-keys";
import { collectMatchedKeys } from "../helpers/collect-matched-keys";
import { filterTree } from "../helpers/filter-tree";
import { findNodePath } from "../helpers/find-node-path";
import { findParentByKey } from "../helpers/find-parent-by-key";
import { isNodeInSubtree } from "../helpers/is-node-in-subtree";
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
  selectedSlug?: string | null;
  contentRef?: Ref<HTMLDivElement>;
  structureEditable?: boolean;
  onToggleStructureEdit?: () => void;
}

export const CollectionsTree = observer(
  ({
    onSelectNode,
    renderActions,
    showDescription = false,
    compact = false,
    className,
    selectedSlug,
    contentRef,
    structureEditable = false,
    onToggleStructureEdit,
  }: CollectionsTreeProps) => {
    const { t } = useTranslation();
    const [messageApi, contextHolder] = message.useMessage();

    const [appliedSearchQuery, setAppliedSearchQuery] = useState<string>("");
    const [expandedKeys, setExpandedKeys] = useState<Key[]>([]);
    const [autoExpandParent, setAutoExpandParent] = useState<boolean>(false);

    const initialExpandDone = useRef<boolean>(false);
    const savedExpandedKeys = useRef<Key[]>([]);
    const prevSearch = useRef<string>("");

    const location = useLocation();
    const pathnameRef = useRef(location.pathname);

    const activeSlug = useMemo(
      () =>
        selectedSlug !== undefined
          ? selectedSlug
          : (pathnameRef.current.match(/^\/core\/minions\/([^/]+)/)?.[1] ?? null),
      [selectedSlug]
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
        if (structureEditable) return;
        onSelectNode(info.node);
      },
      [onSelectNode, structureEditable]
    );

    const onExpand = useCallback((newExpandedKeys: Key[]) => {
      setExpandedKeys(newExpandedKeys);
      setAutoExpandParent(false);
    }, []);

    const isDndActive = structureEditable && !appliedSearchQuery;

    const allowDrop = useCallback<NonNullable<TreeProps<CollectionTreeAntdNode>["allowDrop"]>>(
      ({ dragNode, dropNode, dropPosition }) => {
        if (dropNode.slug === ROOT_SLUG && dropPosition !== 0) return false;
        if (dropNode.key === dragNode.key) return false;
        if (isNodeInSubtree(dragNode, dropNode.key)) return false;
        return true;
      },
      []
    );

    const handleDrop = useCallback<NonNullable<TreeProps<CollectionTreeAntdNode>["onDrop"]>>(
      (info) => {
        if (collectionsTreeStore.isMoving) return;

        const dragNode = info.dragNode as CollectionTreeAntdNode;
        if (dragNode.slug === ROOT_SLUG) return;

        const dropNode = info.node as CollectionTreeAntdNode;

        const dropPos = info.node.pos.split("-");
        const relativePosition = info.dropPosition - Number(dropPos[dropPos.length - 1]);

        let newParent: CollectionTreeAntdNode | null;
        let insertBeforeKey: Key | null;

        if (!info.dropToGap) {
          newParent = dropNode;
          insertBeforeKey = dropNode.children?.[0]?.key ?? null;
        } else if (relativePosition === 1 && info.node.expanded && dropNode.children?.length) {
          newParent = dropNode;
          insertBeforeKey = dropNode.children[0].key;
        } else {
          newParent = findParentByKey(treeData, dropNode.key);
          if (!newParent) return;
          const siblings = newParent.children ?? [];
          const dropIndex = siblings.findIndex((sibling) => sibling.key === dropNode.key);
          const insertIndex = relativePosition === -1 ? dropIndex : dropIndex + 1;
          insertBeforeKey = siblings[insertIndex]?.key ?? null;
        }

        const parent = newParent;
        if (parent.key === dragNode.key) return;
        if (isNodeInSubtree(dragNode, parent.key)) return;
        if (insertBeforeKey === dragNode.key) return;

        const hasDuplicateTitle = parent.children?.some(
          (child) => child.key !== dragNode.key && child.title === dragNode.title
        );
        if (hasDuplicateTitle) {
          messageApi.warning(t("collection.duplicate-title-on-move"));
          return;
        }

        setExpandedKeys((prev) => (prev.includes(parent.key) ? prev : [...prev, parent.key]));
        setAutoExpandParent(false);

        collectionsTreeStore
          .moveCollection(
            String(dragNode.key),
            String(parent.key),
            insertBeforeKey != null ? String(insertBeforeKey) : null
          )
          .then((ok) => {
            if (!ok) messageApi.error(t("collection.error-moving-collection"));
          });
      },
      [treeData, messageApi, t]
    );

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
        {contextHolder}
        <Flex className={styles.header} gap="small" align="center">
          <SearchInput
            disabled={!!collectionsTreeStore.error}
            autoFocus
            onSearch={handleSearchChange}
          />
          <MinionsTreeRefreshButton />
          {onToggleStructureEdit && (
            <Tooltip title={t("collection.edit-structure")}>
              <Button
                className={styles.editStructureButton}
                type={structureEditable ? "primary" : "default"}
                size="small"
                icon={<ApartmentOutlined />}
                onClick={onToggleStructureEdit}
              />
            </Tooltip>
          )}
        </Flex>

        {structureEditable && (
          <Typography.Text type="secondary">{t("collection.edit-structure-hint")}</Typography.Text>
        )}

        <Spin
          wrapperClassName={styles.content}
          spinning={
            collectionsTreeStore.fetchTreeStatus === "in-process" || collectionsTreeStore.isMoving
          }
        >
          <div ref={contentRef}>
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
                selectable={!structureEditable}
                blockNode
                draggable={
                  isDndActive
                    ? {
                        icon: <HolderOutlined />,
                        nodeDraggable: (node) =>
                          (node as CollectionTreeAntdNode).slug !== ROOT_SLUG,
                      }
                    : false
                }
                allowDrop={isDndActive ? allowDrop : undefined}
                onDrop={isDndActive ? handleDrop : undefined}
                treeData={highlightedTreeData}
                titleRender={titleRender}
                expandedKeys={expandedKeys}
                selectedKeys={selectedKeys}
                autoExpandParent={autoExpandParent}
                onExpand={onExpand}
                onSelect={onSelect}
              />
            )}
          </div>
        </Spin>
      </Flex>
    );
  }
);
