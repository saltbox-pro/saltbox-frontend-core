import { PlusOutlined, SyncOutlined } from "@ant-design/icons";
import { SearchInput } from "@saltbox/saltbox-frontend-common";
import { type MenuProps, Alert, Button, Dropdown, Empty, Flex, Skeleton, Space, Spin } from "antd";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { CreateArchiveSourceModal } from "../../upload/ui/create-archive-source-modal";
import { CreateGitSourceModal } from "../../upload/ui/create-git-source-modal";
import { CreateLocalSourceModal } from "../../upload/ui/create-local-source-modal";
import { normalizeSearch } from "../helpers/search";
import { ConfigurationTemplatesStore } from "../store/configuration-templates-store";

import { TemplateSourceListEntry } from "./components/template-source-list-entry";

type AddSourceModal = "local" | "git" | "archive" | null;

export const ConfigurationTemplates = observer(() => {
  const { t } = useTranslation();

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
    const q = normalizeSearch(search);
    const sorted = store.sortedSources;

    if (!q) return sorted;

    return sorted.filter((source) => {
      const name = source.name?.toLowerCase() ?? "";
      const desc = source.description?.toLowerCase() ?? "";
      return name.includes(q) || desc.includes(q);
    });
  }, [search, store.sortedSources]);

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

  const searchQuery = useMemo(() => normalizeSearch(search), [search]);
  const hasSearchQuery = searchQuery.length > 0;

  return (
    <Skeleton loading={store.isLoading && store.sources.length === 0} active>
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

        <Spin spinning={store.isLoading && store.sources.length > 0}>
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
            <Flex vertical gap="large">
              {filteredSources.map((source) => (
                <TemplateSourceListEntry key={source.id} source={source} store={store} />
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
