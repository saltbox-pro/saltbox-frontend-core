import { Alert, Flex, Skeleton, Space } from "antd";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { TemplateSourceActionsToolbar } from "../../actions/ui/template-source-actions-toolbar";
import { canAddSourceFiles } from "../../files/helpers/can-add-source-files";
import { AddSourceFileModal } from "../../files/ui/add-source-file-modal";
import { TemplateSourceFilesSection } from "../../files/ui/template-source-files-section";
import {
  getSourceActionContext,
  isAddFileInProgress,
} from "../../shared/helpers/source-action-progress";
import { getTemplateSourceViewState } from "../../shared/helpers/get-template-source-view-state";
import { TemplateSourceContent } from "../../shared/ui/template-source-content";
import { TemplateSourceTags } from "../../shared/ui/template-source-tags";
import { TemplateSourceTemplatesSection } from "../../templates/ui/template-source-templates-section";
import type { TemplateSourceDetailStore } from "../store/template-source-detail-store";

type TemplateSourceDetailProps = {
  store: TemplateSourceDetailStore;
};

export const TemplateSourceDetail = observer(function TemplateSourceDetail({
  store,
}: TemplateSourceDetailProps) {
  const { t } = useTranslation();
  const [addFileModalOpen, setAddFileModalOpen] = useState(false);

  if (store.isLoading) {
    return <Skeleton active />;
  }

  if (store.hasError) {
    return <Alert type="error" showIcon message={t("configuration-templates.detail.load-error")} />;
  }

  if (!store.source) {
    return null;
  }

  const view = getTemplateSourceViewState(store.source, store);
  const templatesState = store.templatesStore.getState(store.source.id);
  const filesState = store.filesStore.getState(store.source.id);
  const canAddFile = canAddSourceFiles(store.source, store);
  const addingFile = isAddFileInProgress(getSourceActionContext(store, store.source.id));

  return (
    <Space direction="vertical" size="large">
      <Flex vertical gap="middle">
        <Flex align="flex-start" justify="space-between" gap="middle" wrap>
          <TemplateSourceTags
            sourceType={store.source.source_type}
            isConnected={view.isConnected}
            showActiveStatus={view.presentation.showActiveStatus}
          />

          <TemplateSourceActionsToolbar
            source={store.source}
            actions={store}
            canConnect={view.canConnect}
            canSync={view.canSync}
            showDelete={view.showDelete}
          />
        </Flex>

        <TemplateSourceContent
          source={store.source}
          showNotSynced={view.showNotSynced}
          dimmed={view.forceDimmed}
        />
      </Flex>

      <TemplateSourceTemplatesSection
        defaultExpanded
        items={templatesState.items}
        isLoading={templatesState.isLoading}
        hasError={templatesState.hasError}
        onOpen={() => store.templatesStore.loadAll(store.source.id)}
      />

      <TemplateSourceFilesSection
        items={filesState.items}
        isLoading={filesState.isLoading}
        hasError={filesState.hasError}
        onOpen={() => store.filesStore.loadAll(store.source.id)}
        sourceId={store.source.id}
        filesStore={store.filesStore}
        canAddFile={canAddFile}
        isAddFileInProgress={addingFile}
        onAddFileClick={canAddFile ? () => setAddFileModalOpen(true) : undefined}
      />

      <AddSourceFileModal
        open={addFileModalOpen}
        sourceId={store.source.id}
        sourceName={store.source.name}
        onAddFile={(_, payload) => store.addSourceFile(payload)}
        onClose={() => setAddFileModalOpen(false)}
      />
    </Space>
  );
});
