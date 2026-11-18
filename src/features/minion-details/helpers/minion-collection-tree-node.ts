type MinionCollectionNodeRef = {
  slug: string;
  isAvailable?: boolean;
};

export type MinionCollectionNodeInteraction = "active" | "muted" | "openable";

export function getMinionCollectionNodeInteraction(
  node: MinionCollectionNodeRef,
  activeSlug?: string
): MinionCollectionNodeInteraction {
  if (node.isAvailable !== true) {
    return "muted";
  }

  if (activeSlug && node.slug === activeSlug) {
    return "active";
  }

  return "openable";
}
