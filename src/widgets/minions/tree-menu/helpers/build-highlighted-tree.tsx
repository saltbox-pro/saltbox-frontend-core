import type { Key } from "react";

import type { CollectionTreeAntdNode } from "../types/node";
import { HighlightText } from "../ui/highlight-text";

export function buildHighlightedNode(
  node: CollectionTreeAntdNode,
  appliedSearchQuery: string,
  matchedKeys: Set<Key>
): CollectionTreeAntdNode {
  const strTitle = String(node.title ?? "");
  const isMatched = matchedKeys.has(node.key) || !appliedSearchQuery;

  const title = <HighlightText text={strTitle} search={appliedSearchQuery} isMatched={isMatched} />;

  const children = node.children as CollectionTreeAntdNode[] | undefined;
  return {
    ...node,
    title,
    children: children?.map((c) => buildHighlightedNode(c, appliedSearchQuery, matchedKeys)),
  };
}
