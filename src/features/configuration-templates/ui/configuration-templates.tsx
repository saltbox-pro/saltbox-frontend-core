import { SearchOutlined, SettingOutlined } from "@ant-design/icons";
import { Alert, Button, Dropdown, Empty, Flex, Input, Skeleton, Space } from "antd";
import { observer } from "mobx-react-lite";
import { type ChangeEventHandler, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { normalizeSearch } from "../helpers/search";
import { ConfigurationTemplatesStore } from "../model/configuration-templates-store";

import { ConnectedRepoCard } from "./connected-repo-card";
import { DisconnectedRepoCard } from "./disconnected-repo-card";

const DEBOUNCE_MS = 250;

export const ConfigurationTemplates = observer(() => {
  const { t } = useTranslation();

  const [store] = useState(() => new ConfigurationTemplatesStore());

  const [search, setSearch] = useState("");
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    store.load();

    return () => store.reset();
  }, [store]);

  useEffect(
    () => () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    },
    []
  );

  const filteredConnectedRepos = useMemo(() => {
    const q = normalizeSearch(search);
    if (!q) return store.connectedRepos;

    return store.connectedRepos.filter((repo) => {
      const name = repo.name?.toLowerCase() ?? "";
      const desc = repo.description?.toLowerCase() ?? "";
      return name.includes(q) || desc.includes(q);
    });
  }, [search, store.connectedRepos]);

  const filteredDisconnectedProjects = useMemo(() => {
    const q = normalizeSearch(search);
    if (!q) return store.filteredAvailableProjects;

    return store.filteredAvailableProjects.filter((p) => {
      const name = p.name?.toLowerCase() ?? "";
      const desc = p.description?.toLowerCase() ?? "";
      return name.includes(q) || desc.includes(q);
    });
  }, [search, store.filteredAvailableProjects]);

  const handleSearch = useCallback<ChangeEventHandler<HTMLInputElement>>((e) => {
    const next = e.target.value;
    if (debounceTimer.current != null) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      setSearch(next);
      debounceTimer.current = null;
    }, DEBOUNCE_MS);
  }, []);

  const handleClear = useCallback(() => {
    clearTimeout(debounceTimer.current);
    setSearch("");
    debounceTimer.current = null;
  }, []);

  const isEmptyForView =
    filteredConnectedRepos.length === 0 && filteredDisconnectedProjects.length === 0;

  return (
    <Skeleton loading={store.isLoading} active={store.isLoading}>
      <Space direction="vertical" size="middle">
        <Flex align="stretch" gap="middle">
          <Input
            onChange={handleSearch}
            onClear={handleClear}
            placeholder={t("configuration-templates.search.placeholder")}
            allowClear
            prefix={<SearchOutlined />}
          />

          <Dropdown
            menu={{
              items: [],
              onClick: () => {},
            }}
            trigger={["click"]}
          >
            <Button icon={<SettingOutlined />} />
          </Dropdown>
        </Flex>

        {store.hasError ? (
          <Alert message={t("configuration-templates.load-error")} type="error" showIcon />
        ) : store.isEmpty || isEmptyForView ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={t("configuration-templates.empty")}
          />
        ) : (
          <Flex vertical gap="large">
            {filteredConnectedRepos.map((project) => (
              <ConnectedRepoCard
                key={project.id}
                project={project}
                templatesStore={store.templatesStore}
              />
            ))}

            {filteredDisconnectedProjects.map((project) => (
              <DisconnectedRepoCard key={project.id} project={project} />
            ))}
          </Flex>
        )}
      </Space>
    </Skeleton>
  );
});
