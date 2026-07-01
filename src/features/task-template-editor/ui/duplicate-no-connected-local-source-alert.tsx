import { Alert } from "antd";
import clsx from "clsx";
import { useTranslation } from "react-i18next";

import styles from "./duplicate-no-connected-local-source-alert.module.css";

type DuplicateNoConnectedLocalSourceAlertProps = {
  variant?: "page" | "modal";
};

export function DuplicateNoConnectedLocalSourceAlert({
  variant = "modal",
}: DuplicateNoConnectedLocalSourceAlertProps) {
  const { t } = useTranslation();

  return (
    <Alert
      type="info"
      showIcon
      className={clsx(styles.alert, variant === "page" && styles.inPage)}
      message={t("configuration-templates.source.duplicate-disabled-no-local-source")}
    />
  );
}
