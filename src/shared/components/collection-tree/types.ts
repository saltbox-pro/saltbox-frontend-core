import type { TreeDataNode } from "antd";
import type { ReactNode } from "react";

export type CollectionTreeAntdNode = Omit<TreeDataNode, "children" | "title"> & {
  title?: ReactNode;
  titleText: string;
  slug: string;
  description?: string;
  minionsCount: number;
  isAvailable?: boolean;
  children?: CollectionTreeAntdNode[];
};
