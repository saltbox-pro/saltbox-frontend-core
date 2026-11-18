import { findTreeLeaves } from "saltbox-core/shared/utils/tree-utils";

type CollectionMembershipNode = {
  title: string;
  slug: string;
  is_available?: boolean;
  children?: CollectionMembershipNode[] | null;
};

export function findMinionMembershipCollection(
  treeNodes: CollectionMembershipNode[]
): { title: string; slug: string; isAvailable?: boolean } | undefined {
  const leaf = findTreeLeaves(treeNodes)[0];
  if (!leaf) {
    return undefined;
  }

  return {
    title: leaf.title,
    slug: leaf.slug,
    isAvailable: leaf.is_available,
  };
}
