import { PlusOutlined, SyncOutlined } from "@ant-design/icons";
import { SearchInput } from "@saltbox/saltbox-frontend-common";
import { type MenuProps, Alert, Button, Dropdown, Empty, Flex, Skeleton, Space, Spin } from "antd";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { CreateArchiveSourceModal } from "../../upload/ui/create-archive-source-modal";
import { CreateGitSourceModal } from "../../upload/ui/create-git-source-modal";
import { CreateLocalSourceModal } from "../../upload/ui/create-local-source-modal";
import {
  getActiveSearchQuery,
  MIN_SOURCE_SEARCH_LENGTH,
  sourceMatchesQuery,
} from "../helpers/source-search";
import { ConfigurationTemplatesStore } from "../store/configuration-templates-store";

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

  const filteredSources = useMemo(() => {
    const query = getActiveSearchQuery(search);
    const sorted = store.sortedSources;

    if (!query) return sorted;

    return sorted.filter((source) => sourceMatchesQuery(source, query, i18n.language));
  }, [i18n.language, search, store.sortedSources]);

  const addMenuItems: MenuProps["items"] = useMemo(
    () => [
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
    [t]
  );

  const searchQuery = useMemo(() => getActiveSearchQuery(search), [search]);
  const hasSearchQuery = searchQuery !== undefined;
  const hasPendingSearch = search.trim().length > 0 && !hasSearchQuery;

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
              icon={<SyncOutlined spin={store.isLoading} />}
              onClick={() => {
                store
                  .load()
                  .catch((error) => console.error("Failed to load template sources:", error));
              }}
              disabled={store.isLoading}
              title={t("configuration-templates.actions.refresh")}
            />

            <Dropdown menu={{ items: addMenuItems }} trigger={["click"]}>
              <Button type="primary" icon={<PlusOutlined />}>
                {t("common.add")}
              </Button>
            </Dropdown>
          </Space>
        </Flex>

        {!!store.hasError && (
          <Alert message={t("configuration-templates.load-error")} type="error" showIcon />
        )}

        <Spin spinning={store.isLoading && store.hasLoadedOnce}>
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
            <Flex vertical gap="large">
              {filteredSources.map((source) => (
                <TemplateSourceListEntry
                  key={source.id}
                  source={source}
                  store={store}
                  searchQuery={searchQuery}
                />
              ))}
            </Flex>
          )}
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
