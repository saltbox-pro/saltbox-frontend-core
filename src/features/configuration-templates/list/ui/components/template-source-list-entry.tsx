import type { TemplateSourcePublicSchema } from "@saltbox/saltbox-core-api-client";
import { observer } from "mobx-react-lite";
import { useState } from "react";

import { TemplateSourceActionsToolbar } from "../../../actions/ui/template-source-actions-toolbar";
import { canAddSourceFiles } from "../../../files/helpers/can-add-source-files";
import { AddSourceFileModal } from "../../../files/ui/add-source-file-modal";
import {
  getSourceActionContext,
  isAddFileInProgress,
} from "../../../shared/helpers/source-action-progress";
import { getTemplateSourceViewState } from "../../../shared/helpers/get-template-source-view-state";
import { getTemplateSourceDetailPath } from "../../../shared/helpers/source-presentation";
import { TemplateSourceLastErrorAlert } from "../../../shared/ui/template-source-last-error-alert";
import type { ConfigurationTemplatesListStore } from "../../store/configuration-templates-store";

import { TemplateSourceListItem } from "./template-source-list-item";

export interface TemplateSourceListEntryProps {
  source: TemplateSourcePublicSchema;
  store: ConfigurationTemplatesListStore;
}

export const TemplateSourceListEntry = observer(
  ({ source, store }: TemplateSourceListEntryProps) => {
    const view = getTemplateSourceViewState(source, store);
    const templatesState = store.templatesStore.getState(source.id);
    const filesState = store.filesStore.getState(source.id);
    const [addFileModalOpen, setAddFileModalOpen] = useState(false);
    const canAddFile = canAddSourceFiles(source, store);
    const addingFile = isAddFileInProgress(getSourceActionContext(store, source.id));

    return (
      <>
        <TemplateSourceListItem
          name={source.name}
          detailHref={getTemplateSourceDetailPath(source.id)}
          sourceType={source.source_type}
          showActiveStatusTag={view.presentation.showActiveStatus}
          description={source.description || undefined}
          webUrl={view.webUrl}
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
              showDelete={view.showDelete}
            />
          }
          betweenInfoAndTemplates={<TemplateSourceLastErrorAlert source={source} />}
          templates={{
            items: templatesState.items,
            isLoading: templatesState.isLoading,
            hasError: templatesState.hasError,
            onOpen: () => store.templatesStore.loadAll(source.id),
          }}
          files={{
            items: filesState.items,
            isLoading: filesState.isLoading,
            hasError: filesState.hasError,
            onOpen: () => store.filesStore.loadAll(source.id),
            sourceId: source.id,
            filesStore: store.filesStore,
            canAddFile,
            isAddFileInProgress: addingFile,
            onAddFileClick: canAddFile ? () => setAddFileModalOpen(true) : undefined,
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
