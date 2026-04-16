import { Tag } from "antd";
import { useTranslation } from "react-i18next";

export interface RepoCardConnectionProps {
  isConnected: boolean;
}

export function RepoCardConnection({ isConnected }: RepoCardConnectionProps) {
  const { t } = useTranslation();

  return (
    <Tag color={isConnected ? "green" : "gold"}>
      {t(`configuration-templates.repo.connection.${isConnected ? "connected" : "disconnected"}`)}
    </Tag>
  );
}
