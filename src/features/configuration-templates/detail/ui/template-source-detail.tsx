import { Alert, Card, Flex, Skeleton, Space } from "antd";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import {
  canAddSourceFiles,
  canShowAddSourceFileButton,
} from "../../files/helpers/can-add-source-files";
import { AddSourceFileModal } from "../../files/ui/add-source-file-modal";
import { getTemplateSourceViewState } from "../../shared/helpers/get-template-source-view-state";
import {
  getSourceActionContext,
  isAddFileInProgress,
} from "../../shared/helpers/source-action-progress";
import { getCreateTemplatePath } from "../../shared/helpers/source-presentation";
import { TemplateSourceActionsToolbar } from "../../shared/ui/template-source-actions-toolbar";
import { TemplateSourceContent } from "../../shared/ui/template-source-content";
import { TemplateSourceExtrasCollapse } from "../../shared/ui/template-source-extras-collapse";
import { TemplateSourceTags } from "../../shared/ui/template-source-tags";
import {
  canDuplicateSourceTemplate,
  canEditSourceTemplates,
  isEditableTemplateSource,
} from "../../templates/helpers/can-manage-source-templates";
import type { TemplateSourceDetailStore } from "../store/template-source-detail-store";

type TemplateSourceDetailProps = {
  store: TemplateSourceDetailStore;
};

export const TemplateSourceDetail = observer(function TemplateSourceDetail({
  store,
}: TemplateSourceDetailProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
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
  const canAddFile = canAddSourceFiles(store.source, store);
  const showAddFileButton = canShowAddSourceFileButton(store.source);
  const addingFile = isAddFileInProgress(getSourceActionContext(store, store.source.id));

  const sourceId = store.source.id;
  const isLocalSource = isEditableTemplateSource(store.source);
  const canEditTemplates = canEditSourceTemplates(store.source, store);
  const canDuplicateTemplates = canDuplicateSourceTemplate(store.source, store);

  return (
    <Space direction="vertical" size="large">
      <Card size="small">
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
      </Card>

      <TemplateSourceExtrasCollapse
        templates={{
          items: store.source.templates ?? [],
          onCreateTemplate: isLocalSource
            ? () => navigate(getCreateTemplatePath(sourceId))
            : undefined,
          canCreateTemplate: canEditTemplates,
          showEditTemplate: isLocalSource,
          canEditTemplates,
          canDuplicateTemplates,
        }}
        files={{
          items: store.source.files ?? [],
          onDeleteFile: (fileId) => store.deleteSourceFile(fileId),
          onDeleteError: () => store.reloadSource(),
          canAddFile,
          isAddFileInProgress: addingFile,
          onAddFileClick: showAddFileButton ? () => setAddFileModalOpen(true) : undefined,
        }}
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
