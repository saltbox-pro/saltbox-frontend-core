import type { SourceListWithExtrasSchema } from "@saltbox/saltbox-core-api-client";
import type { MessageInstance } from "antd/es/message/interface";
import { observer } from "mobx-react-lite";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import {
  filterSourceFilesForSearch,
  filterSourceTemplatesForSearch,
} from "saltbox-core/features/template-source-search";

import {
  canAddSourceFiles,
  canDeleteSourceFiles,
  canShowAddSourceFileButton,
} from "../../../files/helpers/can-add-source-files";
import { AddSourceFileModal } from "../../../files/ui/add-source-file-modal";
import { getTemplateSourceViewState } from "../../../shared/helpers/get-template-source-view-state";
import {
  getSourceActionContext,
  isAddFileInProgress,
} from "../../../shared/helpers/source-action-progress";
import {
  getCreateTemplatePath,
  getTemplateSourceDetailPath,
} from "../../../shared/helpers/source-presentation";
import { TemplateSourceActionsToolbar } from "../../../shared/ui/template-source-actions-toolbar";
import { TemplateSourceLastErrorAlert } from "../../../shared/ui/template-source-last-error-alert";
import {
  canEditSourceTemplates,
  isEditableTemplateSource,
} from "../../../templates/helpers/can-manage-source-templates";
import { getSourceTemplateActionsPermissions } from "../../../templates/helpers/source-template-actions";
import type { TemplatePreviewListProps } from "../../../templates/hooks/use-template-preview-drawer";
import { getSourceSearchForcedActiveKeys } from "../../helpers/source-search";
import type { ConfigurationTemplatesListStore } from "../../store/configuration-templates-store";

import { TemplateSourceListItem } from "./template-source-list-item";

export interface TemplateSourceListEntryProps {
  source: SourceListWithExtrasSchema;
  store: ConfigurationTemplatesListStore;
  searchQuery?: string;
  templatePreview?: TemplatePreviewListProps;
  messageApi: MessageInstance;
}

export const TemplateSourceListEntry = observer(
  ({ source, store, searchQuery, templatePreview, messageApi }: TemplateSourceListEntryProps) => {
    const { i18n } = useTranslation();
    const navigate = useNavigate();
    const view = getTemplateSourceViewState(source, store);
    const [addFileModalOpen, setAddFileModalOpen] = useState(false);
    const canAddFile = canAddSourceFiles(source, store);
    const canDeleteFile = canDeleteSourceFiles(source, store);
    const showAddFileButton = canShowAddSourceFileButton(source);
    const addingFile = isAddFileInProgress({
      ...getSourceActionContext(store, source.id),
      source,
    });

    const isLocalSource = isEditableTemplateSource(source);
    const canEditTemplates = canEditSourceTemplates(source, store);
    const templateActionsPermissions = getSourceTemplateActionsPermissions(source, store, {
      hasConnectedLocalSource: store.hasConnectedLocalSource,
    });

    const forcedActiveKeys = useMemo(
      () => getSourceSearchForcedActiveKeys(source, searchQuery, i18n.language),
      [i18n.language, searchQuery, source]
    );

    const visibleTemplates = useMemo(
      () => filterSourceTemplatesForSearch(source, searchQuery, i18n.language),
      [i18n.language, searchQuery, source]
    );

    const visibleFiles = useMemo(
      () => filterSourceFilesForSearch(source, searchQuery),
      [searchQuery, source]
    );

    return (
      <>
        <TemplateSourceListItem
          name={source.name}
          searchQuery={searchQuery}
          detailHref={getTemplateSourceDetailPath(source.id)}
          sourceType={source.source_type}
          sourceState={source.state}
          currentOperation={source.current_operation}
          showActiveStatusTag={view.presentation.showActiveStatus}
          description={source.description || undefined}
          webUrl={view.webUrl}
          branch={view.branch}
          mountedPath={view.mountedPath}
          namespace={view.namespace}
          isConnected={view.isConnected}
          forceDimmed={view.forceDimmed}
          syncedAt={source.synced_at}
          showNotSynced={view.showNotSynced}
          createdAt={source.created}
          headerExtra={
            <TemplateSourceActionsToolbar
              source={source}
              actions={store}
              canConnect={view.canConnect}
              canSync={view.canSync}
              canUnplug={view.canUnplug}
              canUpdateContent={view.canUpdateContent}
              showDelete={view.showDelete}
              messageApi={messageApi}
            />
          }
          betweenInfoAndTemplates={<TemplateSourceLastErrorAlert source={source} />}
          extras={{
            templates: {
              items: visibleTemplates,
              totalCount: source.templates?.length ?? 0,
              searchQuery,
              onCreateTemplate: isLocalSource
                ? () => navigate(getCreateTemplatePath(source.id))
                : undefined,
              canCreateTemplate: canEditTemplates,
              permissions: templateActionsPermissions,
              onDeleteTemplate: templateActionsPermissions.showDelete
                ? (templateId) => store.deleteSourceTemplate(source.id, templateId)
                : undefined,
              onDeleteTemplateError: () => store.reloadSource(source.id),
              ...templatePreview,
            },
            files: {
              items: visibleFiles,
              totalCount: source.files?.length ?? 0,
              searchQuery,
              onDeleteFile: (fileId) => store.deleteSourceFile(source.id, fileId),
              onDeleteError: () => store.reloadSource(source.id),
              canAddFile,
              canDeleteFile,
              isAddFileInProgress: addingFile,
              onAddFileClick: showAddFileButton ? () => setAddFileModalOpen(true) : undefined,
            },
            forcedActiveKeys,
          }}
        />

        <AddSourceFileModal
          open={addFileModalOpen}
          sourceId={source.id}
          sourceName={source.name}
          onAddFile={store.addSourceFile}
          onClose={() => setAddFileModalOpen(false)}
        />
      </>
    );
  }
);
