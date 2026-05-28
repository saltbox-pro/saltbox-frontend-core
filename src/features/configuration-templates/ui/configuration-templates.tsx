import { PlusOutlined } from "@ant-design/icons";
import { SearchInput } from "@saltbox/saltbox-frontend-common";
import { type MenuProps, Alert, Button, Dropdown, Empty, Flex, Skeleton, Space } from "antd";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { normalizeSearch } from "../helpers/search";
import { ConfigurationTemplatesStore } from "../model/configuration-templates-store";

import { CreateGitSourceModal } from "./create-git-source-modal";
import { CreateLocalSourceModal } from "./create-local-source-modal";
import { SourceCard } from "./source-card";

type AddSourceModal = "local" | "git" | null;

export const ConfigurationTemplates = observer(() => {
  const { t } = useTranslation();

  const [store] = useState(() => new ConfigurationTemplatesStore());
  const [search, setSearch] = useState("");
  const [addSourceModal, setAddSourceModal] = useState<AddSourceModal>(null);

  useEffect(() => {
    store.load();

    return () => store.reset();
  }, [store]);

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

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
  }, []);

  const addMenuItems: MenuProps["items"] = [
    {
      key: "add-local",
      label: t("configuration-templates.actions.add-local-source"),
    },
    {
      key: "add-git",
      label: t("configuration-templates.actions.add-git-source"),
    },
  ];

  const handleAddMenuClick: MenuProps["onClick"] = ({ key }) => {
    if (key === "add-local") {
      setAddSourceModal("local");
      return;
    }
    if (key === "add-git") {
      setAddSourceModal("git");
    }
  };

  const searchQuery = normalizeSearch(search);
  const hasSearchQuery = searchQuery.length > 0;

  const renderSourcesList = () => {
    if (filteredSources.length === 0) {
      return (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            hasSearchQuery
              ? t("configuration-templates.search.no-results")
              : t("configuration-templates.empty")
          }
        />
      );
    }

    return (
      <Flex vertical gap="large">
        {filteredSources.map((source) => (
          <SourceCard key={source.id} source={source} store={store} />
        ))}
      </Flex>
    );
  };

  return (
    <Skeleton loading={store.isLoading && store.sources.length === 0} active>
      <Space direction="vertical" size="middle">
        <Flex align="stretch" gap="middle">
          <SearchInput
            placeholder={t("configuration-templates.search.placeholder")}
            onSearch={handleSearchChange}
          />

          <Dropdown menu={{ items: addMenuItems, onClick: handleAddMenuClick }} trigger={["click"]}>
            <Button type="primary" icon={<PlusOutlined />}>
              {t("common.add")}
            </Button>
          </Dropdown>
        </Flex>

        {!!store.hasError && (
          <Alert message={t("configuration-templates.load-error")} type="error" showIcon />
        )}

        {renderSourcesList()}
      </Space>

      <CreateLocalSourceModal
        open={addSourceModal === "local"}
        store={store}
        onClose={() => setAddSourceModal(null)}
      />

      <CreateGitSourceModal
        open={addSourceModal === "git"}
        store={store}
        onClose={() => setAddSourceModal(null)}
      />
    </Skeleton>
  );
});
