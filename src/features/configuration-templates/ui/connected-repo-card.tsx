import type { SettingsSlsRepoShortSchema } from "@saltbox/saltbox-core-api-client";
import { observer } from "mobx-react-lite";

import { RepoCard } from "saltbox-core/shared/components/repo-card";

import type { ConnectedTemplatesStore } from "../model/connected-templates-store";

export interface ConnectedRepoCardProps {
  project: SettingsSlsRepoShortSchema;
  templatesStore: ConnectedTemplatesStore;
}

export const ConnectedRepoCard = observer(({ project, templatesStore }: ConnectedRepoCardProps) => {
  const repoId = String(project.id);
  const templatesState = templatesStore.getState(repoId);
  const hasMore = templatesStore.hasMore(repoId);

  return (
    <RepoCard
      name={project.name}
      description={project?.description}
      webUrl={project.repo_url.toString()}
      syncedAt={project?.last_synced || null}
      isConnected
      templates={{
        items: templatesState.items,
        isLoading: templatesState.isLoading,
        isLoadedOnce: templatesState.isLoadedOnce,
        hasMore,
        error: templatesState.error,
        onOpen: () => templatesStore.loadFirstPage(repoId),
        onLoadMore: () => templatesStore.loadMore(repoId),
      }}
    />
  );
});
