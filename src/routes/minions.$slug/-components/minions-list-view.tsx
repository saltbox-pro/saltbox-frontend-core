import { ExportOutlined, PlusOutlined, SyncOutlined } from "@ant-design/icons";
import { MinionShortSchema, TaskTargetMinion } from "@saltbox/saltbox-core-api-client";
import {
  createSelectColumn,
  FastTablePaginated,
  formatTimeByUserTZ,
  pastTimeByUserTZ,
  Popover,
  RelativeTime,
} from "@saltbox/saltbox-frontend-common";
import { createColumnHelper, RowSelectionState } from "@tanstack/react-table";
import { Badge, Button, Flex, message, Spin, Tag } from "antd";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Parcel from "single-spa-react/parcel";

import { useCsvDownloader } from "saltbox-core/features/csv-download";
import {
  PolicyCreateModal,
  TaskCreateModal,
  useTaskWorkflow,
} from "saltbox-core/features/task-workflow";
import type { MinionDetailsProps } from "saltbox-core/shared/components/minion-details/minion-details";
import {
  appStore,
  CollectionStore,
  mastersStore,
  MinionFilterStore,
  MinionsStore,
} from "saltbox-core/store";
import {
  MinionDetailsDrawer,
  useMinionDetailsDrawer,
} from "saltbox-core/widgets/minion-details-drawer";

import styles from "./minions-list-view.module.css";
import { MinionsQueryBuilder } from "./minions-query-builder";

const MinionsTable = FastTablePaginated<MinionShortSchema>;

const minionsColumnHelper = createColumnHelper<MinionShortSchema>();

const lastActivitySecondsToBadgeColor = (seconds: number) => {
  if (seconds < 5 * 60) return "green";
  if (seconds < 24 * 60 * 60) return "cyan";
  return "red";
};

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
    new MinionsStore(props.filterStore.searchMongoDBQuery, undefined)
  );
  const [selection, setSelection] = useState<RowSelectionState>({});
  const [selectedMinions, setSelectedMinions] = useState<TaskTargetMinion[]>([]);
  const [messageApi, contextHolder] = message.useMessage();
  const minionDrawer = useMinionDetailsDrawer();

  const minionColumns = useMemo(
    () => [
      createSelectColumn<MinionShortSchema>(),
      minionsColumnHelper.accessor("minion_id", {
        header: t("minions.table-minion-id"),
        cell: (data) => data.row.original.minion_id ?? data.getValue(),
        meta: {
          showCopy: true,
          copyValue: (row) => row.minion_id ?? row.id,
          actions: [
            {
              icon: <ExportOutlined />,
              onClick: (_, row) => {
                window.open(`/core/minions/${props.slug}/${row.id}`, "_blank");
              },
              title: t("minions.open-in-new-tab"),
            },
          ],
          color: "accent",
          width: 260,
          minWidth: 260,
          maxWidth: 260,
          ellipsis: true,
        },
      }),
      minionsColumnHelper.accessor("grains.fqdn", {
        id: "grains.fqdn",
        header: t("minions.table-fqdn"),
        meta: { width: 120, minWidth: 120, maxWidth: 120, ellipsis: true },
      }),
      minionsColumnHelper.accessor("grains.domain", {
        id: "grains.domain",
        header: t("minions.table-domain"),
        meta: { width: 150, minWidth: 150, maxWidth: 150, ellipsis: true },
      }),
      minionsColumnHelper.accessor("master", {
        header: t("minions.table-master"),
        meta: { width: 150, minWidth: 150, maxWidth: 150, ellipsis: true },
      }),
      minionsColumnHelper.accessor("grains.saltversion", {
        id: "grains.saltversion",
        header: t("minions.table-client-version"),
        meta: { width: 155, minWidth: 155, maxWidth: 155 },
      }),
      minionsColumnHelper.accessor("grains.osfinger", {
        id: "grains.osfinger",
        header: t("minions.table-os"),
        meta: { width: 180, minWidth: 180, maxWidth: 180, ellipsis: true },
      }),
      minionsColumnHelper.accessor("grains.efi", {
        id: "grains.efi",
        header: t("minions.table-efi"),
        cell: (data) => {
          return (
            <Tag color={data.getValue() ? "green" : "red"}>
              {data.getValue() ? t("minions.efi-yes") : t("minions.efi-no")}
            </Tag>
          );
        },
        meta: { width: 100 },
      }),
      minionsColumnHelper.accessor((row) => row.grains?.["efi-secure-boot"], {
        id: "grains.efi-secure-boot",
        header: t("minions.table-secure-boot"),
        cell: (data) => {
          const value = data.getValue();
          if (value === null || value === undefined) return "";
          return (
            <Tag color={value ? "green" : "red"}>
              {value ? t("minions.efi-yes") : t("minions.efi-no")}
            </Tag>
          );
        },
      }),
      minionsColumnHelper.accessor("created", {
        header: t("minions.table-created"),
        cell: (data) => <RelativeTime date={data.getValue()} />,
      }),
      minionsColumnHelper.accessor("last_activity", {
        header: t("minions.table-last-activity"),
        cell: (data) => {
          const lastActivitySeconds = data?.row.original.last_activity_seconds;
          const componentData = lastActivitySeconds
            ? {
                badgeColor: lastActivitySecondsToBadgeColor(lastActivitySeconds),
                badgeText: pastTimeByUserTZ(data.getValue()),
                popoverContent: formatTimeByUserTZ(data.getValue()),
              }
            : {
                badgeColor: "orange",
                badgeText: t("minions.never-synced"),
                popoverContent: undefined,
              };
          return (
            <Popover content={componentData.popoverContent}>
              <span>
                <Badge
                  className={styles.lastActivityBadge}
                  color={componentData.badgeColor}
                  text={componentData.badgeText}
                />
              </span>
            </Popover>
          );
        },
      }),
    ],
    [t]
  );

  useEffect(() => {
    minionsStore.setCollectionSlug(props.slug);
  }, [props.slug]);

  useEffect(() => {
    minionsStore.mongoDBQuery = props.filterStore.searchMongoDBQuery;
    minionsStore.handleSearch();
  }, [props.filterStore.searchMongoDBQuery]);

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

  const handleDrawerFilterButtonClick = useCallback<
    NonNullable<MinionDetailsProps["onFilterButton"]>
  >(
    (params) => {
      props.filterStore.addFilter({
        field: `grains.${params.name}`,
        operator: "=",
        valueSource: "value",
        value: params.value,
      });
      props.filterStore.handleSearch();
      props.onAddFilter();
      minionDrawer.close();
    },
    [props.filterStore, props.onAddFilter, minionDrawer.close]
  );

  const handleOpenMinionDrawer = async (innerId: string, minionId: string) => {
    await minionDrawer.open({
      slug: props.slug,
      innerId,
      minionId,
    });
  };

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

        <MinionsTable
          columns={minionColumns}
          getRowId={(row) => row.id}
          data={minionsStore.minions}
          total={minionsStore.totalMinions}
          isLoading={minionsStore.isLoading}
          pagination={minionsStore.pagination}
          sorting={minionsStore.sorting}
          onRowSelectionChange={setSelection}
          rowSelection={selection}
          onLazyLoad={(pagination, sorting) => minionsStore.handleLazyLoad(pagination, sorting)}
          onRowClick={(minion) => {
            handleOpenMinionDrawer(minion.id, minion.minion_id);
          }}
          useVirtualScroll={false}
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

      <MinionDetailsDrawer
        isOpened={minionDrawer.isOpened}
        openedId={minionDrawer.openedId}
        minionStore={minionDrawer.minionStore}
        slug={minionDrawer.slug}
        error={minionDrawer.error}
        onClose={minionDrawer.close}
        clearData={minionDrawer.clearData}
        onFilterButton={handleDrawerFilterButtonClick}
      />

      {taskModalCreatePlugin}
    </>
  );
});
