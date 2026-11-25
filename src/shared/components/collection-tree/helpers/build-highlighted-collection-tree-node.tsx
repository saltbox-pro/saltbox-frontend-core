import { SearchHighlightText } from "@saltbox/saltbox-frontend-common";
import clsx from "clsx";
import type { Key } from "react";

import type { CollectionTreeAntdNode } from "../types";

import styles from "./build-highlighted-collection-tree-node.module.css";

function getTitleClassName(
  strTitle: string,
  appliedSearchQuery: string,
  isMatched: boolean
): string | undefined {
  const normalizedQuery = appliedSearchQuery.trim().toLowerCase();

  if (!normalizedQuery) {
    return undefined;
  }

  const hasMatch = strTitle.toLowerCase().includes(normalizedQuery);

  return clsx(
    !hasMatch && !isMatched && styles.titleDimmed,
    hasMatch && isMatched && styles.titleBold
  );
}

export function buildHighlightedCollectionTreeNode(
  node: CollectionTreeAntdNode,
  appliedSearchQuery: string,
  matchedKeys: Set<Key>
): CollectionTreeAntdNode {
  const strTitle = node.titleText;
  const isMatched = matchedKeys.has(node.key) || !appliedSearchQuery;
  const titleClassName = getTitleClassName(strTitle, appliedSearchQuery, isMatched);

  const title = titleClassName ? (
    <span className={titleClassName}>
      <SearchHighlightText text={strTitle} query={appliedSearchQuery} />
    </span>
  ) : (
    <SearchHighlightText text={strTitle} query={appliedSearchQuery} />
  );

  return {
    ...node,
    title,
    children: node.children?.map((child) =>
      buildHighlightedCollectionTreeNode(child, appliedSearchQuery, matchedKeys)
    ),
  };
}
