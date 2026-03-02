import { Alert } from "antd";
import { useTranslation } from "react-i18next";

interface InfoDrawerErrorProps {
  message: string | null | undefined;
}

export function InfoDrawerError({ message }: InfoDrawerErrorProps) {
  const { t } = useTranslation();

  return <Alert message={t("errors.load-failed")} description={message} type="error" showIcon />;
}
