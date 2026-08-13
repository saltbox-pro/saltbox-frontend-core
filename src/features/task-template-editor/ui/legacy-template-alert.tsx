import { Alert, Button, message } from "antd";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";

import type { TemplateEditorStore } from "../model/template-editor-store";

import styles from "./legacy-template-alert.module.css";

interface LegacyTemplateAlertProps {
  store: TemplateEditorStore;
}

export const LegacyTemplateAlert = observer(({ store }: LegacyTemplateAlertProps) => {
  const { t } = useTranslation();
  const [messageApi, contextHolder] = message.useMessage();

  if (!store.isLegacyTemplate) return null;

  const handleMigrate = () => {
    try {
      store.migrateFromLegacyFormat();
      messageApi.success(t("task-template-editor.legacy-migrate-success"));
    } catch (error) {
      console.error("Failed to migrate legacy template:", error);
      messageApi.error(t("task-template-editor.legacy-migrate-error"));
    }
  };

  return (
    <>
      {contextHolder}
      <Alert
        className={styles.alert}
        type="warning"
        showIcon
        message={t("task-template-editor.legacy-detected")}
        description={t("task-template-editor.legacy-detected-description")}
        action={
          <Button size="small" type="primary" onClick={handleMigrate}>
            {t("task-template-editor.legacy-migrate")}
          </Button>
        }
      />
    </>
  );
});
