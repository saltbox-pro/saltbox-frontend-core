import { Flex, Input } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import styles from "./extra-data-search-field.module.css";

const { Search } = Input;

type ExtraDataSearchFieldProps = {
  onSearch: (value: string) => void;
};

export function ExtraDataSearchField(props: ExtraDataSearchFieldProps) {
  const { t } = useTranslation();
  const [value, setValue] = useState("");

  return (
    <Flex align="center" gap={8} className={styles.root}>
      <span className={styles.extraDataSearchTitle}>{t("minions.extra-data.search-label")}</span>
      <Search
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onSearch={props.onSearch}
        allowClear
        enterButton
        placeholder={t("minions.extra-data.search-placeholder")}
        className={styles.search}
      />
    </Flex>
  );
}
