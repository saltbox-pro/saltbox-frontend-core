import { Input } from "antd";
import { type ChangeEvent, type Key, useState } from "react";
import { useTranslation } from "react-i18next";

import { flattenTree } from "../helpers/flatten-tree";
import { getParentKey } from "../helpers/get-parent-key";
import type { CollectionTreeAntdNode } from "../types/node";

export interface MinionsTreeSearchProps {
  disabled: boolean;
  treeData: CollectionTreeAntdNode[];
  defaultExpandedKeys: Key[];
  onAppliedSearchChange: (appliedSearch: string, expandedKeys: Key[]) => void;
}

export function MinionsTreeSearch({
  disabled,
  treeData,
  defaultExpandedKeys,
  onAppliedSearchChange,
}: MinionsTreeSearchProps) {
  const { t } = useTranslation();
  const [searchValue, setSearchValue] = useState("");

  const handleSearch = (value: string) => {
    const trimmed = value.trim().toLowerCase();

    if (!trimmed) {
      onAppliedSearchChange("", defaultExpandedKeys);
      return;
    }

    const flatList = flattenTree(treeData);
    const newExpandedKeys = flatList
      .filter((item) => item.title.toLowerCase().includes(trimmed))
      .map((item) => getParentKey(item.key, treeData))
      .filter((key, index, self): key is Key => key !== null && self.indexOf(key) === index);

    onAppliedSearchChange(trimmed, newExpandedKeys);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setSearchValue(value);

    if (!value) {
      onAppliedSearchChange("", defaultExpandedKeys);
    }
  };

  return (
    <Input.Search
      placeholder={t("collection.search-collections")}
      allowClear
      disabled={disabled}
      value={searchValue}
      onChange={handleChange}
      onSearch={handleSearch}
    />
  );
}
