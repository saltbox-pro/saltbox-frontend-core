import { ErrorZone } from "@saltbox/saltbox-frontend-common";
import { Card, Flex, message, Skeleton, Space } from "antd";
import { observer } from "mobx-react-lite";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { sortTemplatesByTitle } from "saltbox-core/features/template-source-search";

import {
  canAddSourceFiles,
  canDeleteSourceFiles,
  canShowAddSourceFileButton,
} from "../../files/helpers/can-add-source-files";
import { AddSourceFileModal } from "../../files/ui/add-source-file-modal";
import { TEMPLATE_SOURCE_TEMPLATES_PANEL_KEY } from "../../shared/constants/template-source-extras-panel-keys";
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
  canEditSourceTemplates,
  isEditableTemplateSource,
} from "../../templates/helpers/can-manage-source-templates";
import { getSourceTemplateActionsPermissions } from "../../templates/helpers/source-template-actions";
import { useTemplatePreviewDrawer } from "../../templates/hooks/use-template-preview-drawer";
import { TemplatePreviewDrawer } from "../../templates/ui/template-preview-drawer";
import { useHighlightedTemplateFromNavigation } from "../hooks/use-highlighted-template-from-navigation";
import type { TemplateSourceDetailStore } from "../store/template-source-detail-store";

type TemplateSourceDetailProps = {
  store: TemplateSourceDetailStore;
};

export const TemplateSourceDetail = observer(function TemplateSourceDetail({
  store,
}: TemplateSourceDetailProps) {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [addFileModalOpen, setAddFileModalOpen] = useState(false);
  const { drawer, previewStore, openedTemplate, templatesListProps } = useTemplatePreviewDrawer();
  const sortedTemplates = useMemo(
    () =>
      store.source?.templates
        ? sortTemplatesByTitle(store.source.templates, i18n.language)
        : undefined,
    [i18n.language, store.source?.templates]
  );
  const highlightedTemplateId = useHighlightedTemplateFromNavigation(
    Boolean(store.source) && !store.isLoading
  );

  if (store.isLoading) {
    return <Skeleton active />;
  }

  if (store.sourceLoad.error) {
    return (
      <ErrorZone
        level="page"
        loaders={[store.sourceLoad]}
        onNavigateHome={() => navigate("/core/configuration-templates")}
      >
        {null}
      </ErrorZone>
    );
  }

  if (!store.source) {
    return null;
  }

  const view = getTemplateSourceViewState(store.source, store);
  const canAddFile = canAddSourceFiles(store.source, store);
  const canDeleteFile = canDeleteSourceFiles(store.source, store);
  const showAddFileButton = canShowAddSourceFileButton(store.source);
  const addingFile = isAddFileInProgress({
    ...getSourceActionContext(store, store.source.id),
    source: store.source,
  });

  const sourceId = store.source.id;
  const isLocalSource = isEditableTemplateSource(store.source);
  const canEditTemplates = canEditSourceTemplates(store.source, store);
  const templateActionsPermissions = getSourceTemplateActionsPermissions(store.source, store, {
    hasConnectedLocalSource: store.hasConnectedLocalSource,
  });

  return (
    <Space ref={drawer.mainContentRef} direction="vertical" size="large">
      {contextHolder}
      <Card size="small">
        <Flex vertical gap="middle">
          <Flex align="flex-start" justify="space-between" gap="middle" wrap>
            <TemplateSourceTags
              sourceType={store.source.source_type}
              state={store.source.state}
              currentOperation={store.source.current_operation}
              isConnected={view.isConnected}
              showActiveStatus={view.presentation.showActiveStatus}
            />

            <TemplateSourceActionsToolbar
              source={store.source}
              actions={store}
              canConnect={view.canConnect}
              canSync={view.canSync}
              canUnplug={view.canUnplug}
              showDelete={view.showDelete}
              messageApi={messageApi}
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
        defaultActiveKey={[TEMPLATE_SOURCE_TEMPLATES_PANEL_KEY]}
        templates={{
          items: sortedTemplates ?? [],
          highlightedTemplateId,
          onCreateTemplate: isLocalSource
            ? () => navigate(getCreateTemplatePath(sourceId))
            : undefined,
          canCreateTemplate: canEditTemplates,
          permissions: templateActionsPermissions,
          onDeleteTemplate: templateActionsPermissions.showDelete
            ? (templateId) => store.deleteSourceTemplate(templateId)
            : undefined,
          onDeleteTemplateError: () => store.reloadSource(),
          ...templatesListProps,
        }}
        files={{
          items: store.source.files ?? [],
          onDeleteFile: (fileId) => store.deleteSourceFile(fileId),
          onDeleteError: () => store.reloadSource(),
          canAddFile,
          canDeleteFile,
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

      <TemplatePreviewDrawer
        open={drawer.isOpened}
        template={openedTemplate}
        store={previewStore}
        permissions={templateActionsPermissions}
        onDeleteTemplate={
          templateActionsPermissions.showDelete
            ? (templateId) => store.deleteSourceTemplate(templateId)
            : undefined
        }
        onDeleteError={() => store.reloadSource()}
        onClose={drawer.close}
      />
    </Space>
  );
});
