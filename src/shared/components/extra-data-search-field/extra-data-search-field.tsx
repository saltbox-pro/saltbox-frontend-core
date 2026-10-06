import { Input } from "antd";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import styles from "./extra-data-search-field.module.css";

const { Search } = Input;

type ExtraDataSearchFieldProps = {
  value?: string;
  onSearch: (value: string) => void;
};

export function ExtraDataSearchField({ value, onSearch }: ExtraDataSearchFieldProps) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(value ?? "");

  useEffect(() => {
    setDraft(value ?? "");
  }, [value]);

  return (
    <Search
      value={draft}
      onChange={(e) => {
        const nextValue = e.target.value;
        setDraft(nextValue);
        if (!nextValue) {
          onSearch("");
        }
      }}
      onSearch={onSearch}
      allowClear
      enterButton
      placeholder={t("minions.extra-data.search-placeholder")}
      className={styles.search}
      aria-label={t("minions.extra-data.search-placeholder")}
    />
  );
}
