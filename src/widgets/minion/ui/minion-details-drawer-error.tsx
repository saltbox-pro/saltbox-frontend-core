import { Alert } from "antd";
import { useTranslation } from "react-i18next";

interface MinionDetailsDrawerErrorProps {
  message: string | null | undefined;
}

export function MinionDetailsDrawerError({ message }: MinionDetailsDrawerErrorProps) {
  const { t } = useTranslation();

  return <Alert message={t("errors.load-failed")} description={message} type="error" showIcon />;
}
