import type { TemplateSourcePublicSchema } from "@saltbox/saltbox-core-api-client";
import { observer } from "mobx-react-lite";

import { getTemplateSourceViewState } from "../../../shared/helpers/get-template-source-view-state";
import { getTemplateSourceDetailPath } from "../../../shared/helpers/source-presentation";
import { TemplateSourceActionsToolbar } from "../../../actions/ui/template-source-actions-toolbar";
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

    return (
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
      />
    );
  }
);
