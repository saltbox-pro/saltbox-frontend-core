import { SettingOutlined, SyncOutlined } from "@ant-design/icons";
import { SearchInput } from "@saltbox/saltbox-frontend-common";
import {
  type MenuProps,
  Alert,
  Button,
  Dropdown,
  Empty,
  Flex,
  message,
  Skeleton,
  Space,
  Spin,
} from "antd";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { CreateArchiveSourceModal } from "../../upload/ui/create-archive-source-modal";
import { CreateGitSourceModal } from "../../upload/ui/create-git-source-modal";
import { CreateLocalSourceModal } from "../../upload/ui/create-local-source-modal";
import { getGitlabSyncErrorMessageKey } from "../helpers/gitlab-sync-error";
import {
  getActiveSearchQuery,
  MIN_SOURCE_SEARCH_LENGTH,
  sourceMatchesQuery,
} from "../helpers/source-search";
import { ConfigurationTemplatesStore } from "../store/configuration-templates-store";

import { SyncGitlabSourcesButton } from "./components/sync-gitlab-sources-button";
import { TemplateSourceListEntry } from "./components/template-source-list-entry";

type AddSourceModal = "local" | "git" | "archive" | null;

export const ConfigurationTemplates = observer(() => {
  const { t, i18n } = useTranslation();

  const [store] = useState(() => new ConfigurationTemplatesStore());

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
    const succeeded = await store.refreshWithExternalCheck();
    if (succeeded) {
      message.success(t("configuration-templates.sync-gitlab-sources-success"));
    }
  }, [store, t]);

  const filteredSources = useMemo(() => {
    const query = getActiveSearchQuery(search);
    const sorted = store.sortedSources;

    if (!query) return sorted;

    return sorted.filter((source) => sourceMatchesQuery(source, query, i18n.language));
  }, [i18n.language, search, store.sortedSources]);

  const settingsMenuItems: MenuProps["items"] = useMemo(
    () => [
      {
        key: "sync-gitlab-sources",
        label: t("configuration-templates.actions.sync-gitlab-sources"),
        disabled: store.isCheckingExternal,
        onClick: () => handleSyncGitlabSources(),
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
    [handleSyncGitlabSources, store.isCheckingExternal, t]
  );

  const searchQuery = useMemo(() => getActiveSearchQuery(search), [search]);
  const hasSearchQuery = searchQuery !== undefined;
  const hasPendingSearch = search.trim().length > 0 && !hasSearchQuery;
  const isSourcesListEmpty = store.sortedSources.length === 0;
  const showGitlabSourcesAlert =
    store.hasLoadedOnce &&
    !store.hasError &&
    isSourcesListEmpty &&
    !hasSearchQuery &&
    !hasPendingSearch;
  const isListLoading = store.isLoading && store.hasLoadedOnce && !store.isCheckingExternal;

  return (
    <Skeleton loading={store.isLoading && !store.hasLoadedOnce} active>
      <Space direction="vertical" size="middle">
        <Flex align="stretch" gap="middle">
          <SearchInput
            placeholder={t("configuration-templates.search.placeholder")}
            onSearch={handleSearchChange}
          />

          <Space>
            <Button
              icon={<SyncOutlined spin={isListLoading} />}
              onClick={handleLoadSources}
              disabled={store.isLoading || store.isCheckingExternal}
              title={t("configuration-templates.actions.refresh")}
            />

            <Dropdown menu={{ items: settingsMenuItems }} trigger={["click"]}>
              <Button>
                <Flex gap={8} align="center">
                  <SettingOutlined />
                </Flex>
              </Button>
            </Dropdown>
          </Space>
        </Flex>

        {!!store.hasError && (
          <Alert message={t("configuration-templates.load-error")} type="error" showIcon />
        )}

        {store.gitlabSyncError && (
          <Alert
            message={t(getGitlabSyncErrorMessageKey(store.gitlabSyncError))}
            description={store.gitlabSyncErrorDetail ?? undefined}
            type="error"
            showIcon
          />
        )}

        <Spin spinning={isListLoading}>
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

            {filteredSources.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  hasSearchQuery
                    ? t("configuration-templates.search.no-results")
                    : hasPendingSearch
                      ? t("configuration-templates.search.min-length", {
                          count: MIN_SOURCE_SEARCH_LENGTH,
                        })
                      : t("configuration-templates.empty")
                }
              />
            ) : (
              filteredSources.map((source) => (
                <TemplateSourceListEntry
                  key={source.id}
                  source={source}
                  store={store}
                  searchQuery={searchQuery}
                />
              ))
            )}
          </Flex>
        </Spin>
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
    </Skeleton>
  );
});
