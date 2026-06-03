import { SyncOutlined } from "@ant-design/icons";
import { SaltKeyStatusType } from "@saltbox/saltbox-core-api-client";
import { Button, Flex, Select } from "antd";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { DUPLICATES_FILTER, type SaltKeyFilterType } from "saltbox-core/store";

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
      <Button
        className={styles.saltKeysToolbarRefreshButton}
        icon={<SyncOutlined spin={isLoading} />}
        onClick={onRefresh}
        title={t("master.refresh")}
        disabled={isLoading}
      />
    </Flex>
  );
}
