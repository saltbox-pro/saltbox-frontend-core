import { SearchHighlightText } from "@saltbox/saltbox-frontend-common";
import clsx from "clsx";
import type { Key } from "react";

import type { CollectionTreeAntdNode } from "../types/node";

import styles from "./build-highlighted-tree.module.css";

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

export function buildHighlightedNode(
  node: CollectionTreeAntdNode,
  appliedSearchQuery: string,
  matchedKeys: Set<Key>
): CollectionTreeAntdNode {
  const strTitle = String(node.title ?? "");
  const isMatched = matchedKeys.has(node.key) || !appliedSearchQuery;
  const titleClassName = getTitleClassName(strTitle, appliedSearchQuery, isMatched);

  const title = titleClassName ? (
    <span className={titleClassName}>
      <SearchHighlightText text={strTitle} query={appliedSearchQuery} />
    </span>
  ) : (
    <SearchHighlightText text={strTitle} query={appliedSearchQuery} />
  );

  const children = node.children as CollectionTreeAntdNode[] | undefined;
  return {
    ...node,
    title,
    children: children?.map((c) => buildHighlightedNode(c, appliedSearchQuery, matchedKeys)),
  };
}
