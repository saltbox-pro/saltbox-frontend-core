import {
  type AppError,
  Modal,
  PageHeader,
  notify,
  runMutation,
} from "@saltbox/saltbox-frontend-common";
import { Spin } from "antd";
import { observer } from "mobx-react-lite";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { getTemplateSourceDetailPath } from "saltbox-core/features/configuration-templates/shared/helpers/source-presentation";
import type { TemplateSourceNavigationState } from "saltbox-core/features/configuration-templates/shared/types/template-source-navigation-state";
import { getBgTaskErrorMessage } from "saltbox-core/shared/helpers/get-bg-task-error-message";

import { useMonacoReady } from "../hooks/use-monaco-ready";
import { useUnsavedChangesGuard } from "../hooks/use-unsaved-changes-guard";
import type { TemplateEditorStore } from "../model/template-editor-store";

import { DuplicateNoConnectedLocalSourceAlert } from "./duplicate-no-connected-local-source-alert";
import { EditorTabs } from "./editor-tabs";
import { LegacyTemplateAlert } from "./legacy-template-alert";
import { SaveTemplateModal } from "./save-template-modal";
import { TemplateEditorHeader } from "./template-editor-header";
import styles from "./template-editor.module.css";

interface TemplateEditorProps {
  store: TemplateEditorStore;
  title: string;
  backPath: string;
}

export const TemplateEditor = observer(({ store, title, backPath }: TemplateEditorProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [modalApi, modalContextHolder] = Modal.useModal();
  const [isSaveModalOpen, setSaveModalOpen] = useState(false);
  const [saveError, setSaveError] = useState<AppError | null>(null);
  // Вкладки трогают monaco при монтировании (`useMonaco`), поэтому ждём,
  // пока загрузчик настроен на локальную сборку и переводы
  const isMonacoReady = useMonacoReady();

  const confirmLeave = useCallback(
    () =>
      new Promise<boolean>((resolve) => {
        modalApi.confirm({
          title: t("task-template-editor.unsaved-title"),
          content: t("task-template-editor.unsaved-content"),
          icon: null,
          okText: t("task-template-editor.unsaved-leave"),
          cancelText: t("common.cancel"),
          okButtonProps: { danger: true },
          onOk: () => resolve(true),
          onCancel: () => resolve(false),
        });
      }),
    [modalApi, t]
  );

  useUnsavedChangesGuard(() => store.isDirty, confirmLeave);

  const getPostSavePath = (): string => {
    if (store.isDuplicate && store.effectiveTargetSourceId) {
      return getTemplateSourceDetailPath(store.effectiveTargetSourceId);
    }
    return backPath;
  };

  const showNoConnectedLocalSourceAlert =
    store.isDuplicate && !store.isLoadingTargetSources && store.targetSources.length === 0;

  const saveTemplate = async () => {
    setSaveError(null);

    const result = await runMutation({
      run: () => store.save(),
      onError: setSaveError,
    });

    if (!result.ok) return;

    const highlightState: TemplateSourceNavigationState | undefined = result.data
      ? { highlightedTemplateId: result.data }
      : undefined;

    notify.success(t("task-template-editor.save-success"));
    setSaveModalOpen(false);
    navigate(getPostSavePath(), { state: highlightState });
  };

  const handleSaveClick = () => {
    setSaveError(null);
    setSaveModalOpen(true);
  };

  return (
    <div className={styles.page}>
      {modalContextHolder}
      <PageHeader title={title} customParentPathGenerator={() => backPath} />

      {showNoConnectedLocalSourceAlert && <DuplicateNoConnectedLocalSourceAlert variant="page" />}

      <TemplateEditorHeader store={store} onSave={handleSaveClick} />

      <LegacyTemplateAlert store={store} />

      <div className={styles.body}>
        {isMonacoReady ? (
          <EditorTabs store={store} />
        ) : (
          <div className={styles.loading}>
            <Spin />
          </div>
        )}
      </div>

      <SaveTemplateModal
        store={store}
        open={isSaveModalOpen}
        error={saveError}
        errorFallback={getBgTaskErrorMessage(saveError?.raw, t("task-template-editor.save-error"))}
        onErrorClose={() => setSaveError(null)}
        onCancel={() => {
          setSaveError(null);
          setSaveModalOpen(false);
        }}
        onConfirm={saveTemplate}
      />
    </div>
  );
});
