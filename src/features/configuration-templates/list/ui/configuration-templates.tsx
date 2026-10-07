import {
  type ActionDropdownItem,
  ErrorZone,
  RefreshButton,
  SearchInput,
  runMutation,
  SettingsDropdown,
} from "@saltbox/saltbox-frontend-common";
import { Alert, Empty, Flex, message, Skeleton, Space, Spin } from "antd";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  getActiveSearchQuery,
  sourceMatchesQuery,
} from "saltbox-core/features/template-source-search";

import { getSourceTemplateActionsPermissions } from "../../templates/helpers/source-template-actions";
import { useTemplatePreviewDrawer } from "../../templates/hooks/use-template-preview-drawer";
import { TemplatePreviewDrawer } from "../../templates/ui/template-preview-drawer";
import { CreateArchiveSourceModal } from "../../upload/ui/create-archive-source-modal";
import { CreateGitSourceModal } from "../../upload/ui/create-git-source-modal";
import { CreateLocalSourceModal } from "../../upload/ui/create-local-source-modal";
import { ConfigurationTemplatesStore } from "../store/configuration-templates-store";

import { SyncGitlabSourcesButton } from "./components/sync-gitlab-sources-button";
import { TemplateSourceListEntry } from "./components/template-source-list-entry";

type AddSourceModal = "local" | "git" | "archive" | null;

export const ConfigurationTemplates = observer(() => {
  const { t, i18n } = useTranslation();
  const [messageApi, contextHolder] = message.useMessage();

  const [store] = useState(() => new ConfigurationTemplatesStore());
  const { drawer, previewStore, openedTemplate, templatesListProps } = useTemplatePreviewDrawer();

  const [search, setSearch] = useState("");
  const [addSourceModal, setAddSourceModal] = useState<AddSourceModal>(null);

  useEffect(() => {
    store.load();

    return () => store.reset();
  }, [store]);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
  }, []);

  const handleCloseModal = () => {
    setAddSourceModal(null);
  };

  const handleLoadSources = useCallback(() => store.load(), [store]);

  const handleSyncGitlabSources = useCallback(async () => {
    await runMutation({
      run: () => store.refreshWithExternalCheck(),
      successMessage: t("configuration-templates.sync-gitlab-sources-success"),
      errorMessage: t("configuration-templates.sync-gitlab-sources-error"),
    });
  }, [store, t]);

  const handleSyncMountedSources = useCallback(async () => {
    await runMutation({
      run: () => store.refreshWithMountedCheck(),
      successMessage: t("configuration-templates.sync-mounted-sources-success"),
      errorMessage: t("configuration-templates.sync-mounted-sources-error"),
    });
  }, [store, t]);

  const filteredSources = useMemo(() => {
    const query = getActiveSearchQuery(search);
    const sorted = store.sortedSources;

    if (!query) return sorted;

    return sorted.filter((source) => sourceMatchesQuery(source, query, i18n.language));
  }, [i18n.language, search, store.sortedSources]);

  const settingsMenuItems: ActionDropdownItem[] = useMemo(
    () => [
      {
        key: "sync-gitlab-sources",
        label: t("configuration-templates.actions.sync-gitlab-sources"),
        disabled: store.isCheckingExternal || store.isCheckingMounted,
        onClick: () => handleSyncGitlabSources(),
      },
      {
        key: "sync-mounted-sources",
        label: t("configuration-templates.actions.sync-mounted-sources"),
        disabled: store.isCheckingMounted || store.isCheckingExternal,
        onClick: () => handleSyncMountedSources(),
      },
      { type: "divider" },
      {
        key: "add-local",
        label: t("configuration-templates.actions.add-local-source"),
        onClick: () => setAddSourceModal("local"),
      },
      {
        key: "add-git",
        label: t("configuration-templates.actions.add-git-source"),
        onClick: () => setAddSourceModal("git"),
      },
      {
        key: "add-archive",
        label: t("configuration-templates.actions.add-archive-source"),
        onClick: () => setAddSourceModal("archive"),
      },
    ],
    [
      handleSyncGitlabSources,
      handleSyncMountedSources,
      store.isCheckingExternal,
      store.isCheckingMounted,
      t,
    ]
  );

  const searchQuery = useMemo(() => getActiveSearchQuery(search), [search]);
  const hasSearchQuery = searchQuery !== undefined;
  const isSourcesListEmpty = store.sortedSources.length === 0;
  const showGitlabSourcesAlert =
    store.hasLoadedOnce && !store.sourcesLoad.error && isSourcesListEmpty && !hasSearchQuery;
  const isRefreshingList =
    store.isLoading && store.hasLoadedOnce && !store.isCheckingExternal && !store.isCheckingMounted;
  const isListAreaLoading = isRefreshingList || store.isCheckingExternal || store.isCheckingMounted;

  const openedSource = openedTemplate
    ? store.sortedSources.find((source) => source.id === openedTemplate.source_id)
    : undefined;
  const openedTemplateActionsPermissions = openedSource
    ? getSourceTemplateActionsPermissions(openedSource, store, {
        hasConnectedLocalSource: store.hasConnectedLocalSource,
      })
    : null;

  return (
    <Skeleton loading={store.isLoading && !store.hasLoadedOnce} active>
      {contextHolder}
      <Space direction="vertical" size="middle">
        <Flex align="stretch" gap="middle">
          <SearchInput
            placeholder={t("configuration-templates.search.placeholder")}
            onSearch={handleSearchChange}
          />

          <Space>
            <RefreshButton
              loading={isRefreshingList}
              onClick={handleLoadSources}
              disabled={store.isLoading || store.isCheckingExternal || store.isCheckingMounted}
              title={t("configuration-templates.actions.refresh")}
            />

            <SettingsDropdown menu={{ items: settingsMenuItems }} />
          </Space>
        </Flex>

        <ErrorZone level="block" loaders={[store.sourcesLoad]}>
          <Flex vertical gap="large">
            {showGitlabSourcesAlert && (
              <Alert
                type="info"
                showIcon
                message={t("configuration-templates.sync-gitlab-sources-not-loaded.message")}
                action={
                  <SyncGitlabSourcesButton
                    isSyncing={store.isCheckingExternal}
                    onSync={handleSyncGitlabSources}
                    size="small"
                  />
                }
              />
            )}

            <Spin spinning={isListAreaLoading}>
              {filteredSources.length === 0 ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    hasSearchQuery
                      ? t("configuration-templates.search.no-results")
                      : t("configuration-templates.empty")
                  }
                />
              ) : (
                <Flex ref={drawer.mainContentRef} vertical gap="large">
                  {filteredSources.map((source) => (
                    <TemplateSourceListEntry
                      key={source.id}
                      source={source}
                      store={store}
                      searchQuery={searchQuery}
                      templatePreview={templatesListProps}
                      messageApi={messageApi}
                    />
                  ))}
                </Flex>
              )}
            </Spin>
          </Flex>
        </ErrorZone>
      </Space>

      <CreateLocalSourceModal
        open={addSourceModal === "local"}
        store={store}
        onClose={handleCloseModal}
      />

      <CreateGitSourceModal
        open={addSourceModal === "git"}
        store={store}
        onClose={handleCloseModal}
      />

      <CreateArchiveSourceModal
        open={addSourceModal === "archive"}
        store={store}
        onClose={handleCloseModal}
      />

      <TemplatePreviewDrawer
        open={drawer.isOpened}
        template={openedTemplate}
        store={previewStore}
        permissions={openedTemplateActionsPermissions}
        onDeleteTemplate={
          openedSource && openedTemplateActionsPermissions?.showDelete
            ? (templateId) => store.deleteSourceTemplate(openedSource.id, templateId)
            : undefined
        }
        onDeleteError={() =>
          openedSource ? store.reloadSource(openedSource.id) : Promise.resolve()
        }
        onClose={drawer.close}
      />
    </Skeleton>
  );
});
