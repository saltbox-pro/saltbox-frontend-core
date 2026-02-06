import { Alert } from "antd";
import { useTranslation } from "react-i18next";

interface BaseMinionDrawerErrorProps {
  message: string | null | undefined;
}

export function BaseMinionDrawerError({ message }: BaseMinionDrawerErrorProps) {
  const { t } = useTranslation();

  return <Alert message={t("errors.load-failed")} description={message} type="error" showIcon />;
}
