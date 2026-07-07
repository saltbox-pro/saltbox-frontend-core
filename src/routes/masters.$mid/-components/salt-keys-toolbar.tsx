import { SaltKeyStatusType } from "@saltbox/saltbox-core-api-client";
import { RefreshButton } from "@saltbox/saltbox-frontend-common";
import { Flex, Select } from "antd";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { ALL_FILTER, DUPLICATES_FILTER, type SaltKeyFilterType } from "saltbox-core/store";

import styles from "./salt-keys-toolbar.module.css";

type SaltKeysToolbarProps = {
  value: SaltKeyFilterType;
  isLoading?: boolean;
  onChange: (status: SaltKeyFilterType) => void;
  onRefresh: () => void;
};

export function SaltKeysToolbar({ value, isLoading, onChange, onRefresh }: SaltKeysToolbarProps) {
  const { t } = useTranslation();

  const options = useMemo(
    () => [
      { value: ALL_FILTER, label: t("master.table-status-all") },
      { value: SaltKeyStatusType.Unaccepted, label: t("master.table-status-unaccepted") },
      { value: SaltKeyStatusType.Accepted, label: t("master.table-status-accepted") },
      { value: SaltKeyStatusType.Rejected, label: t("master.table-status-rejected") },
      { value: SaltKeyStatusType.Denied, label: t("master.table-status-denied") },
      { value: DUPLICATES_FILTER, label: t("master.table-status-duplicates") },
    ],
    [t]
  );

  return (
    <Flex align="center" className={styles.saltKeysToolbar}>
      <div className={styles.saltKeysToolbarLabel}>{t("master.filter-by-status")}</div>
      <Select<SaltKeyFilterType>
        options={options}
        value={value}
        optionLabelProp="label"
        onChange={onChange}
        disabled={isLoading}
        style={{ minWidth: 150 }}
        styles={{
          popup: {
            root: {
              minWidth: 150,
            },
          },
        }}
      />
      <RefreshButton
        className={styles.saltKeysToolbarRefreshButton}
        loading={isLoading}
        onClick={onRefresh}
        title={t("master.refresh")}
        disabled={isLoading}
      />
    </Flex>
  );
}
