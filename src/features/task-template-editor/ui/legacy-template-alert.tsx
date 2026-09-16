import { notify } from "@saltbox/saltbox-frontend-common";
import { Alert, Button } from "antd";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";

import type { TemplateEditorStore } from "../model/template-editor-store";

import styles from "./legacy-template-alert.module.css";

interface LegacyTemplateAlertProps {
  store: TemplateEditorStore;
}

export const LegacyTemplateAlert = observer(({ store }: LegacyTemplateAlertProps) => {
  const { t } = useTranslation();

  if (!store.isLegacyTemplate) return null;

  const handleMigrate = () => {
    try {
      store.migrateFromLegacyFormat();
      notify.success(t("task-template-editor.legacy-migrate-success"));
    } catch (error) {
      console.error("Failed to migrate legacy template:", error);
      notify.error(t("task-template-editor.legacy-migrate-error"));
    }
  };

  return (
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
  );
});
