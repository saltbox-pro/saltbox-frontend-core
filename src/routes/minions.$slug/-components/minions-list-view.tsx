import { PlusOutlined, SyncOutlined } from "@ant-design/icons";
import { TaskTargetMinion } from "@saltbox/saltbox-core-api-client";
import { MatIcon, SelectedItemsCounter } from "@saltbox/saltbox-frontend-common";
import { RowSelectionState } from "@tanstack/react-table";
import { Button, Flex, message, Spin } from "antd";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Parcel from "single-spa-react/parcel";

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

import { MinionsActionsDropdown } from "./minions-actions-dropdown";
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

type SelectedMinion = TaskTargetMinion & { mid: string };

export const MinionsListView = observer((props: MinionListViewProps) => {
  const { t } = useTranslation();

  const [minionsStore] = useState(
    () => new MinionsStore(props.filterStore.searchMongoDBQuery, undefined)
  );
  const isInitialSearchEffect = useRef(true);
  const [selection, setSelection] = useState<RowSelectionState>({});

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

  const selectedMinions: SelectedMinion[] = useMemo(() => {
    return Object.keys(selection)
      .filter((mongoId) => Boolean(selection[mongoId]))
      .map((mongoId: string) => minionsStore.minions.find((minion) => minion.id === mongoId))
      .filter((minion): minion is NonNullable<typeof minion> => Boolean(minion))
      .map((minion) => {
        return { salt_master: minion.master, minion_id: minion.minion_id, mid: minion.id };
      });
  }, [minionsStore.minions, selection]);

  const clearSelection = useCallback(() => {
    setSelection({});
  }, []);

  const selectedMinionsCount = selectedMinions.length;

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

  const reloadMinions = useCallback(() => {
    minionsStore.loadMinions(props.slug);
  }, [minionsStore.loadMinions, props.slug]);

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
            icon={<MatIcon icon="assignment_add" />}
            onClick={() => handleOpenCreateTaskModal("task")}
            loading={mastersStore.isLoading}
          >
            {t("task-create.create-button")}
          </Button>

          <Button
            icon={<MatIcon icon="add_notes" />}
            onClick={() => handleOpenCreateTaskModal("policy")}
            loading={mastersStore.isLoading}
            disabled={!!selectedMinionsCount}
          >
            {t("policy-create.create-button")}
          </Button>

          {pageActionsButtonsPlugin}

          <MinionsActionsDropdown
            slug={props.slug}
            searchFilters={props.filterStore.searchFilters}
            selectedMinions={selectedMinions}
            clearSelection={clearSelection}
            reloadMinions={reloadMinions}
          />

          <Button
            icon={<SyncOutlined spin={minionsStore.isLoading} />}
            onClick={reloadMinions}
            type="text"
            title={t("minions.refresh")}
          />

          <SelectedItemsCounter count={selectedMinionsCount} />
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
            queryFilterSchema={props.filterStore.filterSchema}
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
            queryFilterSchema={props.filterStore.filterSchema}
            onClose={closeModal}
            onTaskCreated={(taskId) => goToTaskPage(taskId, props.slug)}
          />
        )}
      </Flex>

      {taskModalCreatePlugin}
    </>
  );
});
