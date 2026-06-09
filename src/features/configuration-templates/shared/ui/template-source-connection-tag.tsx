import { Tag } from "antd";
import { useTranslation } from "react-i18next";

export interface TemplateSourceConnectionTagProps {
  isConnected: boolean;
}

export function TemplateSourceConnectionTag({ isConnected }: TemplateSourceConnectionTagProps) {
  const { t } = useTranslation();

  return (
    <Tag color={isConnected ? "green" : "gold"}>
      {t(`configuration-templates.source.connection.${isConnected ? "connected" : "disconnected"}`)}
    </Tag>
  );
}
