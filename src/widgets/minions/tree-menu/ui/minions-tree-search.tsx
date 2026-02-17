import { SearchOutlined } from "@ant-design/icons";
import { Input } from "antd";
import { type ChangeEvent, memo, useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import styles from "./minions-tree-search.module.css";

const DEBOUNCE_MS = 250;

export interface MinionsTreeSearchProps {
  disabled: boolean;
  onSearchChange: (search: string) => void;
}

export const MinionsTreeSearch = memo(function MinionsTreeSearch({
  disabled,
  onSearchChange,
}: MinionsTreeSearchProps) {
  const { t } = useTranslation();

  const [searchValue, setSearchValue] = useState("");

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchValue(value);

      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
      }

      if (!value.trim()) {
        onSearchChange("");
        return;
      }

      debounceTimer.current = setTimeout(() => {
        debounceTimer.current = null;
        onSearchChange(value.trim());
      }, DEBOUNCE_MS);
    },
    [onSearchChange]
  );

  const handleClear = useCallback(() => {
    setSearchValue("");
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    onSearchChange("");
  }, [onSearchChange]);

  useEffect(
    () => () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    },
    []
  );

  return (
    <Input
      className={styles.treeSearch}
      placeholder={t("collection.search-collections")}
      prefix={<SearchOutlined className={styles.treeSearchIcon} />}
      allowClear
      disabled={disabled}
      value={searchValue}
      onChange={handleChange}
      onClear={handleClear}
    />
  );
});
