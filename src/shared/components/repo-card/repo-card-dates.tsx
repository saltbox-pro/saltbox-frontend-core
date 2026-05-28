import { CalendarOutlined, ClockCircleOutlined, HistoryOutlined } from "@ant-design/icons";
import { formatTimeByUserTZ } from "@saltbox/saltbox-frontend-common";
import { Divider, Space, Tag, Typography } from "antd";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

export interface RepoCardDatesProps {
  createdAt?: string;
  updatedAt?: string;
  syncedAt?: string | null;
  showNotSynced?: boolean;
}

export function RepoCardDates({
  createdAt,
  updatedAt,
  syncedAt,
  showNotSynced = false,
}: RepoCardDatesProps) {
  const { t } = useTranslation();

  return (
    <Space align="center" size={2} split={<Divider type="vertical" size="small" />}>
      {!!createdAt && (
        <Space size={3}>
          <Text type="secondary">
            <CalendarOutlined /> {t("configuration-templates.repo.created-at")}:
          </Text>
          <Text>{formatTimeByUserTZ(createdAt)}</Text>
        </Space>
      )}

      {!!updatedAt && (
        <Space size={3}>
          <Text type="secondary">
            <ClockCircleOutlined /> {t("configuration-templates.repo.updated-at")}:
          </Text>
          <Text>{formatTimeByUserTZ(updatedAt)}</Text>
        </Space>
      )}

      {(!!syncedAt || showNotSynced) && (
        <Space size={3}>
          <Text type="secondary">
            <HistoryOutlined /> {t("configuration-templates.repo.synced-at")}:
          </Text>
          {syncedAt ? (
            <Text>{formatTimeByUserTZ(syncedAt)}</Text>
          ) : (
            <Tag color="orange">{t("configuration-templates.source.status.not-synced")}</Tag>
          )}
        </Space>
      )}
    </Space>
  );
}
