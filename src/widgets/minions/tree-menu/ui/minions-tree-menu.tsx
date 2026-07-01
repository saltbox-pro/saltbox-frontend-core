import { observer } from "mobx-react-lite";
import { useCallback } from "react";
import { useNavigate } from "react-router";

import type { CollectionTreeAntdNode } from "../types/node";

import { CollectionsTree } from "./collections-tree";

interface MinionsTreeMenuProps {
  onClose: () => void;
}

export const MinionsTreeMenu = observer(({ onClose }: MinionsTreeMenuProps) => {
  const navigate = useNavigate();

  const onSelectNode = useCallback(
    (node: CollectionTreeAntdNode) => {
      if (node.slug) {
        navigate(`/core/minions/${node.slug}`);
        onClose();
      }
    },
    [navigate, onClose]
  );

  return <CollectionsTree compact onSelectNode={onSelectNode} />;
});
