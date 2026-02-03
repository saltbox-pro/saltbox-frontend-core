import { ExportOutlined, PlusOutlined, SyncOutlined } from "@ant-design/icons";
import { MinionShortSchema, TaskTargetMinion } from "@saltbox/saltbox-core-api-client";
import {
  FastTablePaginated,
  formatTimeByUserTZ,
  pastTimeByUserTZ,
  Popover,
} from "@saltbox/saltbox-frontend-common";
import { Row, RowSelectionState, Table, createColumnHelper } from "@tanstack/react-table";
import { Badge, Button, Checkbox, Flex, Spin, Tag, message } from "antd";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Parcel from "single-spa-react/parcel";

import { useCsvDownloader } from "saltbox-core/features/csv-download";
import {
  TaskCreateModal,
  PolicyCreateModal,
  useTaskWorkflow,
} from "saltbox-core/features/task-workflow";
import { RelativeTime } from "saltbox-core/shared/ui/time";
import { appStore, CollectionStore, MinionFilterStore, MinionsStore } from "saltbox-core/store";
import { MinionDetailsDrawer, useMinionDrawer } from "saltbox-core/widgets/minion";
import type { MinionDetailsProps } from "saltbox-core/shared/components/minion-details/minion-details";

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
  const minionDrawer = useMinionDrawer();

  const minionColumns = useMemo(
    () => [
      {
        id: "select-minion",
        header: ({ table }: { table: Table<MinionShortSchema> }) => {
          return (
            <Checkbox
              checked={table.getIsAllRowsSelected()}
              indeterminate={table.getIsSomeRowsSelected()}
              onChange={table.getToggleAllRowsSelectedHandler()}
            />
          );
        },
        cell: ({ row }: { row: Row<MinionShortSchema> }) => {
          return (
            <Checkbox
              checked={row.getIsSelected()}
              disabled={!row.getCanSelect()}
              onChange={row.getToggleSelectedHandler()}
            />
          );
        },
      },
      minionsColumnHelper.accessor("id", {
        header: t("minions.table-minion-id"),
        cell: (data) => {
          const showMinionId = data.row.original.minion_id ?? data.getValue();
          return <span style={{ color: "#1677ff" }}>{showMinionId}</span>;
        },
        meta: {
          showCopy: true,
          copyValue: (row) => row.minion_id ?? row.id,
          actions: [
            {
              icon: <ExportOutlined />,
              onClick: (_, row) => {
                window.open(`/core/minion/${props.slug}/${row.id}`, "_blank");
              },
              title: t("minions.open-in-new-tab"),
            },
          ],
          tdClassName: "fast-table-column-nowrap",
        },
      }),
      minionsColumnHelper.accessor("grains.fqdn", {
        header: t("minions.table-fqdn"),
      }),
      minionsColumnHelper.accessor("grains.domain", {
        header: t("minions.table-domain"),
      }),
      minionsColumnHelper.accessor("master", {
        header: t("minions.table-master"),
      }),
      minionsColumnHelper.accessor("grains.saltversion", {
        header: t("minions.table-client-version"),
      }),
      minionsColumnHelper.accessor("grains.osfinger", {
        header: t("minions.table-os"),
      }),
      minionsColumnHelper.accessor("grains.efi", {
        header: t("minions.table-efi"),
        cell: (data) => {
          return (
            <Tag color={data.getValue() ? "green" : "red"}>
              {data.getValue() ? t("minions.efi-yes") : t("minions.efi-no")}
            </Tag>
          );
        },
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
      minionDrawer.closeDrawer();
    },
    [props.filterStore, props.onAddFilter, minionDrawer.closeDrawer]
  );

  const handleOpenMinionDrawer = async (innerId: string) => {
    await minionDrawer.openDrawer({
      slug: props.slug,
      innerId,
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

  let taskModalCreatePlugin: React.ReactNode = null;
  appStore.pluginsStore?.plugins?.["minions.taskmodal.create"]?.forEach((plugin) => {
    taskModalCreatePlugin = (
      <>
        {taskModalCreatePlugin}
        <Parcel config={plugin.parcel} wrapWith="div" />
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
          <Button type="primary" icon={<PlusOutlined />} onClick={openTaskCreate}>
            {t("minions.create-task")}
          </Button>

          <Button
            icon={<PlusOutlined />}
            onClick={openPolicyCreate}
            disabled={!!selectedMinions.length}
          >
            {t("minions.create-policy")}
          </Button>

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
            handleOpenMinionDrawer(minion.id);
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
            onTaskCreated={goToTaskPage}
          />
        )}

        {isPolicyCreateOpen && (
          <PolicyCreateModal
            isOpen={isPolicyCreateOpen}
            slug={props.slug}
            collection={props.collectionStore.collection}
            query={props.filterStore?.searchMongoDBQuery ?? {}}
            onClose={closeModal}
            onTaskCreated={goToTaskPage}
          />
        )}
      </Flex>

      <MinionDetailsDrawer
        isOpened={minionDrawer.isOpened}
        openedId={minionDrawer.openedId}
        minionStore={minionDrawer.minionStore}
        slug={minionDrawer.slug}
        error={minionDrawer.error}
        onClose={minionDrawer.closeDrawer}
        clearData={minionDrawer.clearData}
        onFilterButton={handleDrawerFilterButtonClick}
      />

      {taskModalCreatePlugin}
    </>
  );
});
