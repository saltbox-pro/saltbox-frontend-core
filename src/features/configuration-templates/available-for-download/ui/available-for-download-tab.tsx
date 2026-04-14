import { Alert, Empty, Flex, Skeleton } from "antd";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { AvailableForDownloadListStore } from "../model/available-for-download-list-store";

import { RepoCard } from "./repo-card/repo-card";

export const AvailableForDownloadTab = observer(() => {
  const { t } = useTranslation();

  const [store] = useState(() => new AvailableForDownloadListStore());

  useEffect(() => {
    store.load();

    return () => {
      store.reset();
    };
  }, [store]);

  return (
    <Skeleton loading={store.isLoading} active={store.isLoading}>
      {store.error ? (
        <Alert
          message={t("configuration-templates.tabs.available-for-download.load-error")}
          type="error"
          showIcon
        />
      ) : store.templateSources.length > 0 ? (
        <Flex vertical gap="large">
          {store.templateSources.map((project) => (
            <RepoCard key={project.id} {...project} />
          ))}
        </Flex>
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={t("configuration-templates.tabs.available-for-download.empty")}
        />
      )}
    </Skeleton>
  );
});
