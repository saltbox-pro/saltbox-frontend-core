import { observer } from "mobx-react-lite";
import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router";

import { buildCollectionUrl } from "../helpers/build-collection-url";
import type { CollectionTreeAntdNode } from "../types/node";

import { CollectionsTree } from "./collections-tree";

interface MinionsTreeMenuProps {
  onClose: () => void;
}

export const MinionsTreeMenu = observer(({ onClose }: MinionsTreeMenuProps) => {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();

  const handleSelectNode = useCallback(
    (node: CollectionTreeAntdNode) => {
      if (node.slug) {
        navigate(buildCollectionUrl(node.slug, pathname, search));
        onClose();
      }
    },
    [navigate, onClose, pathname, search]
  );

  return <CollectionsTree compact onSelectNode={handleSelectNode} />;
});
