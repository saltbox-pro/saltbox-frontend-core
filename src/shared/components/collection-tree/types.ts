import type { TreeDataNode } from "antd";

export type CollectionTreeAntdNode = Omit<TreeDataNode, "children"> & {
  slug: string;
  description?: string;
  minionsCount: number;
  isAvailable?: boolean;
  children?: CollectionTreeAntdNode[];
};
