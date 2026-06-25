import { Alert } from "antd";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";

import { FullTemplateEditor } from "saltbox-core/features/task-template-editor";

import type { TemplatePreviewStore } from "../store/template-preview-store";

import styles from "./template-preview-drawer-content.module.css";

export type TemplatePreviewDrawerContentProps = {
  store: TemplatePreviewStore;
};

export const TemplatePreviewDrawerContent = observer(function TemplatePreviewDrawerContent({
  store,
}: TemplatePreviewDrawerContentProps) {
  const { t } = useTranslation();

  if (store.isLoading) {
    return null;
  }

  if (store.isEmpty) {
    return (
      <Alert
        type="info"
        showIcon
        message={t("configuration-templates.source.preview-empty-content")}
      />
    );
  }

  if (!store.slsContent) {
    return null;
  }

  return (
    <div className={styles.editor}>
      <FullTemplateEditor value={store.slsContent} readOnly />
    </div>
  );
});
