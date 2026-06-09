import { CalendarOutlined, HistoryOutlined } from "@ant-design/icons";
import { formatTimeByUserTZ } from "@saltbox/saltbox-frontend-common";
import { Divider, Space, Tag, Typography } from "antd";
import { useTranslation } from "react-i18next";

import styles from "./template-source-dates.module.css";

const { Text } = Typography;

export interface TemplateSourceDatesProps {
  createdAt?: string;
  syncedAt?: string | null;
  showNotSynced?: boolean;
}

export function TemplateSourceDates({
  createdAt,
  syncedAt,
  showNotSynced = false,
}: TemplateSourceDatesProps) {
  const { t } = useTranslation();

  return (
    <div className={styles.dates}>
      <Space align="center" size={2} split={<Divider type="vertical" size="small" />}>
        {!!createdAt && (
          <Space size={3}>
            <Text type="secondary">
              <CalendarOutlined /> {t("configuration-templates.source.created-at")}:
            </Text>
            <Text>{formatTimeByUserTZ(createdAt)}</Text>
          </Space>
        )}

        {(!!syncedAt || showNotSynced) && (
          <Space size={3}>
            <Text type="secondary">
              <HistoryOutlined /> {t("configuration-templates.source.synced-at")}:
            </Text>
            {syncedAt ? (
              <Text>{formatTimeByUserTZ(syncedAt)}</Text>
            ) : (
              <Tag color="orange">{t("configuration-templates.source.status.not-synced")}</Tag>
            )}
          </Space>
        )}
      </Space>
    </div>
  );
}
