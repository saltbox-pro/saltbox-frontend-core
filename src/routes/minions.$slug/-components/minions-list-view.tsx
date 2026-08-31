import { TaskTargetMinion } from "@saltbox/saltbox-core-api-client";
import {
  AcceptedMastersActionButton,
  RefreshButton,
  SelectedItemsCounter,
} from "@saltbox/saltbox-frontend-common";
import { RowSelectionState } from "@tanstack/react-table";
import { Flex, message, Spin, theme } from "antd";
import { observer } from "mobx-react-lite";
import { useCallback, useLayoutEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router";
import Parcel from "single-spa-react/parcel";

import {
  PolicyCreateModal,
  TaskCreateModal,
  useTaskWorkflow,
} from "saltbox-core/features/task-workflow";
import { AddTaskIcon } from "saltbox-core/shared/components/icons";
import { asParcelConfig } from "saltbox-core/shared/utils/as-parcel-config";
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
  const [messageApi, contextHolder] = message.useMessage();
  const { token } = theme.useToken();
  const location = useLocation();
  const navigate = useNavigate();

  const [minionsStore] = useState(
    () => new MinionsStore(props.filterStore.searchMongoDBQuery, undefined)
  );
  const [selection, setSelection] = useState<RowSelectionState>({});

  const searchQueryKey = JSON.stringify(props.filterStore.searchMongoDBQuery);
  const shouldWaitForFilterSchema =
    props.filterStore.activeFiltersCount > 0 && props.filterStore.isLoading;
  const shouldDeferLoadForNavigationReset = location.state?.resetFilters === true;

  useLayoutEffect(() => {
    if (shouldWaitForFilterSchema || shouldDeferLoadForNavigationReset) {
      return;
    }

    minionsStore.syncAndLoad(props.slug, props.filterStore.searchMongoDBQuery);
  }, [
    props.slug,
    minionsStore,
    searchQueryKey,
    shouldWaitForFilterSchema,
    shouldDeferLoadForNavigationReset,
    props.filterStore,
  ]);

  const applySearchFilters = useCallback(() => {
    minionsStore.syncAndLoad(props.slug, props.filterStore.searchMongoDBQuery);
  }, [minionsStore, props.slug, props.filterStore]);

  const clearSelection = useCallback(() => {
    setSelection({});
  }, []);

  const handleFilterSearch = useCallback(() => {
    clearSelection();
    applySearchFilters();
  }, [clearSelection, applySearchFilters]);

  const handleFilterReset = useCallback(() => {
    clearSelection();
    applySearchFilters();
  }, [clearSelection, applySearchFilters]);

  const selectedMinions: SelectedMinion[] = useMemo(() => {
    return Object.keys(selection)
      .filter((mongoId) => Boolean(selection[mongoId]))
      .map((mongoId: string) => minionsStore.minions.find((minion) => minion.id === mongoId))
      .filter((minion): minion is NonNullable<typeof minion> => Boolean(minion))
      .map((minion) => {
        return { salt_master: minion.master, minion_id: minion.minion_id, mid: minion.id };
      });
  }, [minionsStore.minions, selection]);

  const selectedMinionsCount = selectedMinions.length;

  const {
    isTaskCreateOpen,
    isPolicyCreateOpen,
    openTaskCreate,
    openPolicyCreate,
    closeModal,
    goToTaskPage,
  } = useTaskWorkflow();

  const reloadMinions = useCallback(() => {
    minionsStore.loadMinions(props.slug);
  }, [minionsStore.loadMinions, props.slug]);

  let taskModalCreatePlugin: React.ReactNode = null;
  appStore.pluginsStore?.plugins?.["minions.taskmodal.create"]?.forEach((plugin) => {
    taskModalCreatePlugin = (
      <>
        {taskModalCreatePlugin}
        <Parcel config={asParcelConfig(plugin.parcel)} wrapWith="div" />
      </>
    );
  });

  let pageActionsButtonsPlugin: React.ReactNode = null;
  appStore.pluginsStore?.plugins?.["minions.pageactionsbuttons"]?.forEach((plugin) => {
    pageActionsButtonsPlugin = (
      <>
        {pageActionsButtonsPlugin}
        <Parcel
          config={asParcelConfig(plugin.parcel)}
          wrapWith="div"
          selectedMinions={selectedMinions}
        />
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
              onSearch={handleFilterSearch}
              onReset={handleFilterReset}
            />
          </Spin>
        )}

        <div className="page-actions-buttons">
          <AcceptedMastersActionButton
            className={styles.createButton}
            type="primary"
            icon={<AddTaskIcon badgeColor={token.colorPrimary} />}
            messageApi={messageApi}
            navigate={navigate}
            checkHasAcceptedMasters={() => mastersStore.hasAcceptedMasters()}
            warningActionText={t("task-create.warning-action.task")}
            onAction={openTaskCreate}
          >
            {t("task-create.create-button")}
          </AcceptedMastersActionButton>

          <AcceptedMastersActionButton
            className={styles.createButton}
            icon={<AddTaskIcon />}
            messageApi={messageApi}
            navigate={navigate}
            checkHasAcceptedMasters={() => mastersStore.hasAcceptedMasters()}
            warningActionText={t("task-create.warning-action.policy")}
            onAction={openPolicyCreate}
            disabled={!!selectedMinionsCount}
          >
            {t("policy-create.create-button")}
          </AcceptedMastersActionButton>

          {pageActionsButtonsPlugin}

          <MinionsActionsDropdown
            slug={props.slug}
            collectionTitle={props.collectionStore.collection?.title}
            searchFilters={props.filterStore.searchFilters}
            query={(props.filterStore.searchMongoDBQuery ?? {}) as Record<string, unknown>}
            selectedMinions={selectedMinions}
            clearSelection={clearSelection}
            reloadMinions={reloadMinions}
          />

          <RefreshButton
            loading={minionsStore.isLoading}
            onClick={reloadMinions}
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
          onFiltersApplied={applySearchFilters}
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
