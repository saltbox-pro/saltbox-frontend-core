import { PlusOutlined, SyncOutlined } from "@ant-design/icons";
import { TaskTargetMinion } from "@saltbox/saltbox-core-api-client";
import { RowSelectionState } from "@tanstack/react-table";
import { Button, Flex, message, Spin } from "antd";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Parcel from "single-spa-react/parcel";

import { useCsvDownloader } from "saltbox-core/features/csv-download";
import {
  PolicyCreateModal,
  TaskCreateModal,
  useTaskWorkflow,
} from "saltbox-core/features/task-workflow";
import {
  appStore,
  CollectionStore,
  mastersStore,
  MinionFilterStore,
  MinionsStore,
} from "saltbox-core/store";

import styles from "./minions-list-view.module.css";
import { MinionsQueryBuilder } from "./minions-query-builder";
import { MinionsTableWithDetailsDrawer } from "./minions-table-with-details-drawer";

type MinionListViewProps = {
  slug: string;
  filterStore: MinionFilterStore;
  collectionStore: CollectionStore;
  showFilter: boolean;
  onAddFilter: () => void;
};

export const MinionsListView = observer((props: MinionListViewProps) => {
  const { t } = useTranslation();
  const [minionsStore] = useState(
    () => new MinionsStore(props.filterStore.searchMongoDBQuery, undefined)
  );
  const isInitialSearchEffect = useRef(true);
  const [selection, setSelection] = useState<RowSelectionState>({});
  const [selectedMinions, setSelectedMinions] = useState<TaskTargetMinion[]>([]);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    minionsStore.setCollectionSlug(props.slug);
  }, [props.slug]);

  useEffect(() => {
    if (isInitialSearchEffect.current) {
      isInitialSearchEffect.current = false;
      return;
    }
    minionsStore.mongoDBQuery = props.filterStore.searchMongoDBQuery;
    minionsStore.handleSearch();
  }, [props.filterStore.searchMongoDBQuery, minionsStore]);

  useEffect(() => {
    const newSelectedMinions: TaskTargetMinion[] = Object.keys(selection)
      .map((minionId: string) => minionsStore.minions.find((minion) => minion.id === minionId))
      .filter((minion) => !!minion)
      .map((minion) => {
        return { salt_master: minion.master, minion_id: minion.minion_id };
      });
    setSelectedMinions(newSelectedMinions);
  }, [selection]);

  const clearSelection = useCallback(() => {
    setSelection({});
  }, []);

  const onCsvDownloadError = useCallback(() => {
    messageApi.error(t("minions.error-on-csv-download"));
  }, [messageApi, t]);

  const { isCSVLoading, handleCSVDownload } = useCsvDownloader({
    slug: props.slug,
    searchFilters: props.filterStore.searchFilters,
    selectedMinions,
    onError: onCsvDownloadError,
  });

  const {
    isTaskCreateOpen,
    isPolicyCreateOpen,
    openTaskCreate,
    openPolicyCreate,
    closeModal,
    goToTaskPage,
  } = useTaskWorkflow();

  const handleOpenCreateTaskModal = useCallback(
    async (typeOfTask: string) => {
      mastersStore
        .hasAcceptedMasters()
        .then((hasMasters) => {
          if (typeOfTask === "task") {
            if (!hasMasters) {
              message.warning(t("task-create.warning-on-create-task"));
            } else {
              openTaskCreate();
            }
          }
          if (typeOfTask === "policy") {
            if (!hasMasters) {
              message.warning(t("task-create.warning-on-create-policy"));
            } else {
              openPolicyCreate();
            }
          }
        })
        .catch(() => {
          message.error(t("task-create.error-on-load-salt-masters"));
        });
    },
    [openTaskCreate, openPolicyCreate]
  );

  let taskModalCreatePlugin: React.ReactNode = null;
  appStore.pluginsStore?.plugins?.["minions.taskmodal.create"]?.forEach((plugin) => {
    taskModalCreatePlugin = (
      <>
        {taskModalCreatePlugin}
        <Parcel config={plugin.parcel} wrapWith="div" />
      </>
    );
  });

  let pageActionsButtonsPlugin: React.ReactNode = null;
  appStore.pluginsStore?.plugins?.["minions.pageactionsbuttons"]?.forEach((plugin) => {
    pageActionsButtonsPlugin = (
      <>
        {pageActionsButtonsPlugin}
        <Parcel config={plugin.parcel} wrapWith="div" selectedMinions={selectedMinions} />
      </>
    );
  });

  return (
    <>
      {contextHolder}

      <Flex vertical className={styles.tabWrapper}>
        {props.showFilter && (
          <Spin spinning={minionsStore.isLoading}>
            <MinionsQueryBuilder
              slug={props.slug}
              filterStore={props.filterStore}
              onSearch={clearSelection}
              onReset={clearSelection}
            />
          </Spin>
        )}

        <div className="page-actions-buttons">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleOpenCreateTaskModal("task")}
            loading={mastersStore.isLoading}
          >
            {t("task-create.create-button")}
          </Button>

          <Button
            icon={<PlusOutlined />}
            onClick={() => handleOpenCreateTaskModal("policy")}
            loading={mastersStore.isLoading}
            disabled={!!selectedMinions.length}
          >
            {t("policy-create.create-button")}
          </Button>

          {pageActionsButtonsPlugin}

          <Button onClick={handleCSVDownload} loading={isCSVLoading}>
            {t("minions.export")}
          </Button>

          <Button
            icon={<SyncOutlined spin={minionsStore.isLoading} />}
            onClick={() => minionsStore.loadMinions(props.slug)}
            type="text"
            title={t("minions.refresh")}
          />
        </div>

        <MinionsTableWithDetailsDrawer
          slug={props.slug}
          minionsStore={minionsStore}
          rowSelection={selection}
          onRowSelectionChange={setSelection}
          filterStore={props.filterStore}
          onAddFilter={props.onAddFilter}
        />

        {isTaskCreateOpen && (
          <TaskCreateModal
            isOpen={isTaskCreateOpen}
            slug={props.slug}
            collection={props.collectionStore.collection}
            minionList={selectedMinions}
            query={props.filterStore?.searchMongoDBQuery ?? {}}
            onClose={closeModal}
            onTaskCreated={(taskId) => goToTaskPage(taskId, props.slug)}
          />
        )}

        {isPolicyCreateOpen && (
          <PolicyCreateModal
            isOpen={isPolicyCreateOpen}
            slug={props.slug}
            collection={props.collectionStore.collection}
            query={props.filterStore?.searchMongoDBQuery ?? {}}
            onClose={closeModal}
            onTaskCreated={(taskId) => goToTaskPage(taskId, props.slug)}
          />
        )}
      </Flex>

      {taskModalCreatePlugin}
    </>
  );
});
