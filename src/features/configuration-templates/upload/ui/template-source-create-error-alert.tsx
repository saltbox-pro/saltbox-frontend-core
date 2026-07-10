import { Alert } from "antd";

import styles from "./template-source-create-error-alert.module.css";

type TemplateSourceCreateErrorAlertProps = {
  message: string;
};

export function TemplateSourceCreateErrorAlert({ message }: TemplateSourceCreateErrorAlertProps) {
  return <Alert type="error" showIcon message={<div className={styles.message}>{message}</div>} />;
}
