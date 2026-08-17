import { Alert, Tabs } from "antd";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";

import { FullTemplateEditor } from "saltbox-core/features/task-template-editor/ui/full-template-editor";

import type { TemplatePreviewStore, TemplatePreviewTabKey } from "../store/template-preview-store";

import styles from "./template-preview-drawer-content.module.css";

export type TemplatePreviewDrawerContentProps = {
  store: TemplatePreviewStore;
};

function PreviewTabBody({
  value,
  emptyMessage,
  language,
}: {
  value: string;
  emptyMessage: string;
  language: string;
}) {
  if (!value.trim()) {
    return <Alert type="info" showIcon message={emptyMessage} />;
  }

  return (
    <div className={styles.editor}>
      <FullTemplateEditor value={value} language={language} readOnly />
    </div>
  );
}

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

  const items = [
    {
      key: "meta" satisfies TemplatePreviewTabKey,
      label: t("configuration-templates.source.preview-tab-meta"),
      children: (
        <PreviewTabBody
          value={store.metaText}
          language="json"
          emptyMessage={t("configuration-templates.source.preview-empty-meta")}
        />
      ),
    },
    {
      key: "sls" satisfies TemplatePreviewTabKey,
      label: t("configuration-templates.source.preview-tab-sls"),
      children: (
        <PreviewTabBody
          value={store.slsContent}
          language="yaml"
          emptyMessage={t("configuration-templates.source.preview-empty-sls")}
        />
      ),
    },
  ];

  return (
    <Tabs
      className={styles.tabs}
      key={store.loadedTemplateId ?? "preview"}
      defaultActiveKey={store.defaultTab}
      destroyOnHidden
      items={items}
    />
  );
});
