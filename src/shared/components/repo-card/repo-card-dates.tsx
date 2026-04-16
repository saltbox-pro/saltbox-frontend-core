import { CalendarOutlined, ClockCircleOutlined, HistoryOutlined } from "@ant-design/icons";
import { RelativeTime } from "@saltbox/saltbox-frontend-common";
import { Divider, Space, Typography } from "antd";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

export interface RepoCardDatesProps {
  createdAt?: string;
  updatedAt?: string;
  syncedAt?: string | null;
}

export function RepoCardDates({ createdAt, updatedAt, syncedAt }: RepoCardDatesProps) {
  const { t } = useTranslation();

  return (
    <Space align="center" size={2} split={<Divider type="vertical" size="small" />}>
      {!!createdAt && (
        <Space size={3}>
          <Text type="secondary">
            <CalendarOutlined /> {t("configuration-templates.repo.created-at")}:
          </Text>
          <RelativeTime date={createdAt} />
        </Space>
      )}

      {!!updatedAt && (
        <Space size={3}>
          <Text type="secondary">
            <ClockCircleOutlined /> {t("configuration-templates.repo.updated-at")}:
          </Text>
          <RelativeTime date={updatedAt} />
        </Space>
      )}

      {(!!syncedAt || syncedAt === null) && (
        <Space size={3}>
          <Text type="secondary">
            <HistoryOutlined /> {t("configuration-templates.repo.synced-at")}:
          </Text>
          {syncedAt ? (
            <RelativeTime date={syncedAt} />
          ) : (
            t("configuration-templates.repo.synced-never")
          )}
        </Space>
      )}
    </Space>
  );
}
