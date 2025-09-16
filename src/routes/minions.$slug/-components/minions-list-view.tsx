import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { generateID } from "react-querybuilder";
import { Link, useNavigate } from "react-router";
import {
  Row,
  RowSelectionState,
  Table,
  createColumnHelper,
} from "@tanstack/react-table";
import { toJS } from "mobx";
import { observer } from "mobx-react-lite";
import Parcel from "single-spa-react/parcel";
import {
  Badge,
  Button,
  Checkbox,
  Drawer,
  Flex,
  Popover,
  Spin,
  Tag,
  message,
} from "antd";
import { ExportOutlined, PlusOutlined, SyncOutlined } from "@ant-design/icons";
import {
  MasterViewSchema,
  MinionShortSchema,
  TaskCreateRequestSchemaInput,
  TaskTargetMinion,
} from "@saltbox/saltbox-core-api-client";
import { CopyToClipboardButton } from "saltbox-core/shared/components/copy-to-clipboard-button/copy-to-clipboard-button";
import { FastTablePaginated, formatTimeByUserTZ, pastTimeByUserTZ } from "@saltbox/saltbox-frontend-common";
import { MinionDetails } from "saltbox-core/shared/components/minion-details/minion-details";
import { TaskModal } from "saltbox-core/shared/components/task-modal/task-modal";
import {
  apiCoreStore,
  appStore,
  CollectionStore,
  envStore,
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

function minionsColumnGenerator(t: any, onMinionClick: (id: string) => void) {
  return [
    {
      id: "select-minion",
      header: ({ table }: { table: Table<MinionShortSchema> }) => (
        <Checkbox
          checked={table.getIsAllRowsSelected()}
          indeterminate={table.getIsSomeRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
        />
      ),
      cell: ({ row }: { row: Row<MinionShortSchema> }) => (
        <Checkbox
          checked={row.getIsSelected()}
          disabled={!row.getCanSelect()}
          onChange={row.getToggleSelectedHandler()}
        />
      ),
    },
    minionsColumnHelper.accessor("minion_id", {
      header: t("minions.table-minion-id"),
      cell: (data) => {
        return (
          <>
            <Button
              type="link"
              size={"small"}
              onClick={() => onMinionClick(data.row.original.id)}
            >
              {data.row.original.minion_id}
            </Button>
            <CopyToClipboardButton text={data.row.original.minion_id} />
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
      cell: (data) => (
        <Tag color={data.getValue() ? "green" : "red"}>
          {data.getValue() ? t("minions.efi-yes") : t("minions.efi-no")}
        </Tag>
      ),
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
  ];
}

type MinionListViewProps = {
  slug: string;
  filterStore: MinionFilterStore;
  collectionStore: CollectionStore;
  showFilter: boolean;
};

const MinionCompactView = observer(
  (props: {
    minionId: string;
    slug: string;
    filterStore: MinionFilterStore;
    onFilterButton: () => void;
  }) => {
    const [minionStore] = useState(new MinionStore(props.slug, props.minionId));
    return (
      <MinionDetails
        minion={minionStore.minion}
        isMinionLoading={minionStore.isMinionLoading}
        pillars={minionStore.pillars}
        isPillarsLoading={minionStore.isPillarsLoading}
        onFilterButton={(params) => {
          props.filterStore.currentFilters = {
            ...props.filterStore.currentFilters,
            rules: [
              ...props.filterStore.currentFilters.rules,
              {
                field: `grains.${params.name}`,
                operator: "=",
                valueSource: "value",
                value: params.value,
                id: generateID(),
              },
            ],
          };
          props.filterStore.handelSearch();
          props.onFilterButton();
        }}
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
  const [selectedMinionIds, setSelectedMinionIds] = useState<
    TaskTargetMinion[]
  >([]);
  const [drawerMinionId, setDrawerMinionId] = useState<string | undefined>();
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    minionsStore.setCollectionSlug(props.slug);
  }, [props.slug]);

  useEffect(() => {
    minionsStore.mongoDBQuery = props.filterStore.searchMongoDBQuery;
    minionsStore.handleSearch();
  }, [props.filterStore.searchMongoDBQuery]);

  useEffect(() => {
    const selectedMinions: TaskTargetMinion[] = Object.keys(selection)
      .map((minionId: string) =>
        minionsStore.minions.find((minion) => minion.id === minionId)
      )
      .filter((minion) => !!minion)
      .map((minion) => {
        return { master: minion.master, minion_id: minion.minion_id };
      });
    setSelectedMinionIds(selectedMinions);
  }, [selection]);

  const handelCSVDownload = async () => {
    try {
      setIsCSVLoading(true);
      const response = await fetch(
        `${envStore.env?.api_base_path}/minions/export`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${appStore.authStore.user?.access_token}`,
          },
          body: JSON.stringify({
            query: props.filterStore.searchMongoDBQuery,
            collection_slug: props.slug,
          }),
        }
      );

      if (!response.ok) throw new Error("Loading Error");

      let filename =
        "export_minions_" +
        new Date().toISOString().replace(/[-:]/g, "_").split(".")[0] +
        ".csv";
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

  let taskModalCreatePlugin: React.ReactNode = null;
  appStore.pluginsStore?.plugins?.['minions.taskmodal.create']?.forEach((plugin) => {
    taskModalCreatePlugin = <>
      {taskModalCreatePlugin}
      <Parcel config={plugin.parcel} wrapWith="div" />
    </>;
  });

  return (
    <>
      {contextHolder}
      <Flex vertical>
        {props.showFilter && (
          <Spin spinning={minionsStore.isLoading}>
            <MinionsQueryBuilder
              slug={props.slug}
              filterStore={props.filterStore}
            />
          </Spin>
        )}

        <div className="page-actions-buttons">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
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
            }}
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

        <Spin
          wrapperClassName={styles.minionsListSpin}
          spinning={minionsStore.isLoading}
        >
          <MinionsTable
            columns={minionsColumnGenerator(t, (minionId) =>
              setDrawerMinionId(minionId)
            )}
            getRowId={(row) => row.id}
            data={toJS(minionsStore.minions)}
            total={minionsStore.totalMinions}
            pagination={minionsStore.pagination}
            onRowSelectionChange={setSelection}
            rowSelection={selection}
            onLazyLoad={(pagination) => minionsStore.handleLazyLoad(pagination)}
          ></MinionsTable>
        </Spin>
        {isCreateTaskModalOpen && (
          <TaskModal
            isOpen={isCreateTaskModalOpen}
            collection={toJS(props.collectionStore.collection)}
            minionList={selectedMinionIds}
            query={props.filterStore?.searchMongoDBQuery ?? {}}
            onClose={handleCreateTaskModalClose}
            saltMasters={saltMasters}
          />
        )}
      </Flex>

      <Drawer
        onClose={() => setDrawerMinionId(undefined)}
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
            onFilterButton={() => setDrawerMinionId(undefined)}
          />
        )}
      </Drawer>

      {taskModalCreatePlugin}
    </>
  );
});
