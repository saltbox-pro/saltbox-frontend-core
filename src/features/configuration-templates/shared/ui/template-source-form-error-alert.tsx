import { Alert } from "antd";

import styles from "./template-source-form-error-alert.module.css";

type TemplateSourceFormErrorAlertProps = {
  message: string;
};

export function TemplateSourceFormErrorAlert({ message }: TemplateSourceFormErrorAlertProps) {
  return <Alert type="error" showIcon message={<div className={styles.message}>{message}</div>} />;
}
