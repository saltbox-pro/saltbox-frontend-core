import { SaveOutlined } from "@ant-design/icons";
import { PageHeader, isGlobalServerError } from "@saltbox/saltbox-frontend-common";
import { Button, message } from "antd";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import type { TemplateEditorStore } from "../model/template-editor-store";

import { EditorTabs } from "./editor-tabs";
import { SaveTemplateModal } from "./save-template-modal";
import styles from "./template-editor.module.css";

interface TemplateEditorProps {
  store: TemplateEditorStore;
  title: string;
  backPath: string;
}

export const TemplateEditor = observer(({ store, title, backPath }: TemplateEditorProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [isSaveModalOpen, setSaveModalOpen] = useState(false);

  const goBack = () => navigate(backPath);

  const saveTemplate = async () => {
    try {
      await store.save();
      messageApi.success(t("task-template-editor.save-success"));
      setSaveModalOpen(false);
      goBack();
    } catch (error) {
      console.error("Failed to save template:", error);
      if (isGlobalServerError(error)) return;
      messageApi.error(t("task-template-editor.save-error"));
    }
  };

  const handleSaveClick = () => setSaveModalOpen(true);

  return (
    <div className={styles.page}>
      {contextHolder}
      <PageHeader title={title} customParentPathGenerator={() => backPath} />

      <div className={styles.body}>
        <EditorTabs
          store={store}
          tabBarExtra={
            <Button
              type="primary"
              size="small"
              icon={<SaveOutlined />}
              disabled={store.hasParseError}
              onClick={handleSaveClick}
            >
              {t("common.save")}
            </Button>
          }
        />
      </div>

      <SaveTemplateModal
        store={store}
        open={isSaveModalOpen}
        onCancel={() => setSaveModalOpen(false)}
        onConfirm={saveTemplate}
      />
    </div>
  );
});
