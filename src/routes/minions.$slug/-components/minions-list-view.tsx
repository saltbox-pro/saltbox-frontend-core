import { ExportOutlined, PlusOutlined, SyncOutlined } from "@ant-design/icons";
import {
  MasterViewSchema,
  MinionShortSchema,
  TaskCreateRequestSchemaInput,
  TaskTargetMinion,
} from "@saltbox/saltbox-core-api-client";
import {
  CopyToClipboardButton,
  FastTablePaginated,
  NavigationIconLink,
  formatTimeByUserTZ,
  pastTimeByUserTZ,
  Drawer,
  Popover,
} from "@saltbox/saltbox-frontend-common";
import { Row, RowSelectionState, Table, createColumnHelper } from "@tanstack/react-table";
import { Badge, Button, Checkbox, Flex, Spin, Tag, message } from "antd";
import { observer } from "mobx-react-lite";
import { ComponentProps, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router";
import Parcel from "single-spa-react/parcel";

import { MinionDetails } from "saltbox-core/shared/components/minion-details/minion-details";
import { TaskModal } from "saltbox-core/shared/components/task-modal/task-modal";
import {
  apiCoreStore,
  appStore,
  CollectionStore,
  MinionFilterStore,
  MinionStore,
  MinionsStore,
  TaskStore,
} from "saltbox-core/store";

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

const MinionCompactView = observer(
  (props: {
    minionId: string;
    slug: string;
    filterStore: MinionFilterStore;
    onFilterButton: ComponentProps<typeof MinionDetails>["onFilterButton"];
  }) => {
    const minionStoreRef = useRef<MinionStore | undefined>(undefined);
    if (!minionStoreRef.current) {
      minionStoreRef.current = new MinionStore(props.slug, props.minionId);
    }
    const minionStore: MinionStore = minionStoreRef.current;
    return (
      <MinionDetails
        minion={minionStore.minion}
        isMinionLoading={minionStore.isMinionLoading}
        pillars={minionStore.pillars}
        isPillarsLoading={minionStore.isPillarsLoading}
        onFilterButton={props.onFilterButton}
      />
    );
  }
);

export const MinionsListView = observer((props: MinionListViewProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [minionsStore] = useState(
    new MinionsStore(props.filterStore.searchMongoDBQuery, undefined)
  );
  const [taskStore] = useState(new TaskStore());
  const [selection, setSelection] = useState<RowSelectionState>({});
  const [isCSVLoading, setIsCSVLoading] = useState(false);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [isCreateTaskLoading, setIsCreateTaskLoading] = useState(false);
  const [saltMasters, setSaltMasters] = useState<Array<MasterViewSchema>>([]);
  const [selectedMinionIds, setSelectedMinionIds] = useState<TaskTargetMinion[]>([]);
  const [drawerMinionId, setDrawerMinionId] = useState<string | undefined>();
  const [messageApi, contextHolder] = message.useMessage();

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
          const minionId = data.row.original.id;
          const showMinionId = data.row.original.minion_id ?? minionId;
          return (
            <>
              <Button
                type="link"
                size={"small"}
                onClick={() => {
                  setDrawerMinionId(minionId);
                }}
                className={styles.minionIdButton}
              >
                {showMinionId}
              </Button>
              <div className={styles.minionIdCopyToClipboardButton}>
                <CopyToClipboardButton text={showMinionId} />
              </div>
              <div className={styles.minionIdNavigationLink}>
                <NavigationIconLink to={`/core/minion/${props.slug}/${minionId}`} target="_blank" />
              </div>
            </>
          );
        },
        meta: {
          tdClassName: "fast-table-column-nowrap",
        },
      }),
      minionsColumnHelper.accessor("grains.fqdn", {
        header: t("minions.table-fqdn"),
      }),
      minionsColumnHelper.accessor("grains.osfullname", {
        header: t("minions.table-os-full-name"),
      }),
      minionsColumnHelper.accessor("grains.domain", {
        header: t("minions.table-domain"),
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
      minionsColumnHelper.accessor("grains.cpu_model", {
        header: t("minions.table-cpu-model"),
      }),
      minionsColumnHelper.accessor("grains.mem_total", {
        header: t("minions.table-total-memory"),
        cell: (data) => {
          if (!data || data?.getValue() === undefined) return "";
          return <>{data.getValue()} Mb</>;
        },
      }),
      minionsColumnHelper.accessor("created", {
        header: t("minions.table-created"),
        cell: (data) => {
          const rawCreated: string = data.getValue();
          const created: string = formatTimeByUserTZ(rawCreated);
          const createdPastTime: string = pastTimeByUserTZ(rawCreated);

          return <Popover content={created}>{createdPastTime}</Popover>;
        },
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
    const selectedMinions: TaskTargetMinion[] = Object.keys(selection)
      .map((minionId: string) => minionsStore.minions.find((minion) => minion.id === minionId))
      .filter((minion) => !!minion)
      .map((minion) => {
        return { master: minion.master, minion_id: minion.minion_id };
      });
    setSelectedMinionIds(selectedMinions);
  }, [selection]);

  const handelCSVDownload = async () => {
    try {
      setIsCSVLoading(true);
      const response = await fetch(`${apiCoreStore.env?.api_base_path}/minions/export`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${appStore.authStore.user?.access_token}`,
        },
        body: JSON.stringify({
          query: props.filterStore.searchMongoDBQuery,
          collection_slug: props.slug,
        }),
      });

      if (!response.ok) throw new Error("Loading Error");

      let filename =
        "export_minions_" + new Date().toISOString().replace(/[-:]/g, "_").split(".")[0] + ".csv";
      const contentDisposition = response.headers.get("Content-Disposition");
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();

      document.body.removeChild(a);

      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 300);

      setIsCSVLoading(false);
    } catch {
      setIsCSVLoading(false);
      messageApi.error(t("minions.error-on-csv-download"));
    }
  };

  const handleCreateTaskClick = useCallback(() => {
    setIsCreateTaskLoading(true);
    apiCoreStore.mastersApi
      ?.mastersList({ status: "accepted" })
      .then((result) => {
        if (result?.data?.length === 0) {
          messageApi.warning(t("minions.warning-on-create-task"));
          return;
        }
        setSaltMasters(result.data);
        setIsCreateTaskModalOpen(true);
      })
      .catch(() => {
        messageApi.error(t("minions.error-on-load-salt-masters"));
      })
      .finally(() => setIsCreateTaskLoading(false));
  }, [messageApi, t]);

  const handleCreateTaskModalClose = (form?: TaskCreateRequestSchemaInput) => {
    if (form === undefined) {
      setIsCreateTaskModalOpen(false);
      return;
    }

    taskStore
      .createTask(form)
      .then((task) => {
        navigate(`/task/${task.id}`);
      })
      .catch(() => {
        messageApi.error(t("minions.error-on-task-create"));
      });
  };

  const handleDrawerClose = useCallback(() => {
    setDrawerMinionId(undefined);
  }, []);

  const handleDrawerFilterButtonClick = useCallback<
    ComponentProps<typeof MinionCompactView>["onFilterButton"]
  >((params) => {
    props.filterStore.addFilter({
      field: `grains.${params.name}`,
      operator: "=",
      valueSource: "value",
      value: params.value,
    });
    props.filterStore.handleSearch();
    props.onAddFilter();
    setDrawerMinionId(undefined);
  }, []);

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
            <MinionsQueryBuilder slug={props.slug} filterStore={props.filterStore} />
          </Spin>
        )}

        <div className="page-actions-buttons">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreateTaskClick}
            loading={isCreateTaskLoading}
          >
            {t("minions.create-task")}
          </Button>

          <Button onClick={() => handelCSVDownload()} loading={isCSVLoading}>
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
          onRowSelectionChange={setSelection}
          rowSelection={selection}
          onLazyLoad={(pagination) => minionsStore.handleLazyLoad(pagination)}
          useVirtualScroll={false}
        />

        {isCreateTaskModalOpen && (
          <TaskModal
            isOpen={isCreateTaskModalOpen}
            collection={props.collectionStore.collection}
            minionList={selectedMinionIds}
            query={props.filterStore?.searchMongoDBQuery ?? {}}
            onClose={handleCreateTaskModalClose}
            saltMasters={saltMasters}
          />
        )}
      </Flex>

      <Drawer
        onClose={handleDrawerClose}
        open={Boolean(drawerMinionId)}
        size={"large"}
        title={t("minions.minion")}
        extra={
          <Link to={`/minion/${props.slug}/${drawerMinionId ?? ""}`}>
            <Button color="default" variant="text" icon={<ExportOutlined />} />
          </Link>
        }
      >
        {drawerMinionId && (
          <MinionCompactView
            slug={props.slug}
            minionId={drawerMinionId}
            filterStore={props.filterStore}
            onFilterButton={handleDrawerFilterButtonClick}
          />
        )}
      </Drawer>

      {taskModalCreatePlugin}
    </>
  );
});
