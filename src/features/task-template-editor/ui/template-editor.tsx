import { SaveOutlined } from "@ant-design/icons";
import { PageHeader, isGlobalServerError } from "@saltbox/saltbox-frontend-common";
import { Button, message } from "antd";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { getTemplateSourceDetailPath } from "saltbox-core/features/configuration-templates/shared/helpers/source-presentation";
import type { TemplateSourceNavigationState } from "saltbox-core/features/configuration-templates/shared/types/template-source-navigation-state";
import { getBgTaskErrorMessage } from "saltbox-core/shared/helpers/get-bg-task-error-message";

import type { TemplateEditorStore } from "../model/template-editor-store";

import { DuplicateNoConnectedLocalSourceAlert } from "./duplicate-no-connected-local-source-alert";
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

  const getPostSavePath = (): string => {
    if (store.isDuplicate && store.effectiveTargetSourceId) {
      return getTemplateSourceDetailPath(store.effectiveTargetSourceId);
    }
    return backPath;
  };

  const showNoConnectedLocalSourceAlert =
    store.isDuplicate && !store.isLoadingTargetSources && store.targetSources.length === 0;

  const saveTemplate = async () => {
    try {
      const savedTemplateId = await store.save();
      const highlightState: TemplateSourceNavigationState | undefined = savedTemplateId
        ? { highlightedTemplateId: savedTemplateId }
        : undefined;

      messageApi.success(t("task-template-editor.save-success"));
      setSaveModalOpen(false);
      navigate(getPostSavePath(), { state: highlightState });
    } catch (error) {
      console.error("Failed to save template:", error);
      if (isGlobalServerError(error)) return;
      messageApi.error(getBgTaskErrorMessage(error, t("task-template-editor.save-error")));
    }
  };

  const handleSaveClick = () => setSaveModalOpen(true);

  return (
    <div className={styles.page}>
      {contextHolder}
      <PageHeader title={title} customParentPathGenerator={() => backPath} />

      {showNoConnectedLocalSourceAlert && <DuplicateNoConnectedLocalSourceAlert variant="page" />}

      <div className={styles.body}>
        <EditorTabs
          store={store}
          tabBarExtra={
            <Button
              type="primary"
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
