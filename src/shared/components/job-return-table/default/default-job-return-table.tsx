import { MinusSquareOutlined, PlusSquareOutlined, ExportOutlined } from "@ant-design/icons";
import { JobReturnModel } from "@saltbox/saltbox-core-api-client";
import { FastTablePaginated, Drawer } from "@saltbox/saltbox-frontend-common";
import {
  OnChangeFn,
  PaginationState,
  Row,
  SortingState,
  createColumnHelper,
} from "@tanstack/react-table";
import { Button, Tag } from "antd";
import { observer } from "mobx-react-lite";
import { ComponentProps, useMemo, useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import ReactJson from "react-json-view";

import { MinionDetails } from "saltbox-core/shared/components/minion-details/minion-details";
import { RelativeTime } from "saltbox-core/shared/ui/time";
import { apiCoreStore, MinionStore } from "saltbox-core/store";

import { TableView } from "../table-view/table-view";
import {
  extractStringValue,
  getShortJobReturnOutput,
  isSimpleStringData,
} from "../utils/job-return-utils";
import { canConvertToTable, mergeJobReturnsToTable } from "../utils/table-converter";

import { ExecutionDuration } from "./components/execution-duration";
import styles from "./default-job-return-table.module.css";

const columnHelper = createColumnHelper<JobReturnModel>();

const JobReturnsTable = FastTablePaginated<JobReturnModel>;

type OnLazyLoad = ComponentProps<typeof JobReturnsTable>["onLazyLoad"];

export const DefaultJobReturnTable = observer(
  ({
    jobReturns,
    isFullOutput = false,
    isTableViewMode = false,
    isLoading = false,
    forceExpand,
    jobStartTimestamp,
    pagination,
    sorting,
    total,
    onLazyLoad,
    onTableViewSortingChange,
    onTableViewFilteredDataChange,
    onTableViewErrorsChange,
  }: {
    jobReturns: JobReturnModel[];
    isFullOutput?: boolean;
    isTableViewMode?: boolean;
    isLoading?: boolean;
    forceExpand?: boolean;
    jobStartTimestamp?: Date | null;
    pagination: PaginationState;
    sorting: SortingState;
    total: number;
    onLazyLoad: OnLazyLoad;
    onTableViewSortingChange?: OnChangeFn<SortingState>;
    onTableViewFilteredDataChange?: (filteredRows: Record<string, unknown>[]) => void;
    onTableViewErrorsChange?: (errors: Array<{ minion_id: string; error: string }>) => void;
  }) => {
    const { t } = useTranslation();
    const [drawerMinionId, setDrawerMinionId] = useState<string | undefined>();
    const [minionStore, setMinionStore] = useState<MinionStore | null>(null);

    const handleOpenDrawer = useCallback(async (minionId: string, saltMaster: string) => {
      setDrawerMinionId(minionId);
      try {
        const minion = await apiCoreStore.minionsApi?.minionGetByMasterAndId({
          master_id: saltMaster,
          minion_id: minionId,
        });
        if (minion?.id) {
          setMinionStore(new MinionStore("root", minion.id));
        }
      } catch (error) {
        console.error("Error loading minion:", error);
      }
    }, []);

    const handleCloseDrawer = useCallback(() => {
      setDrawerMinionId(undefined);
      setMinionStore(null);
    }, []);

    const columns = useMemo(
      () => [
        {
          id: "expander",
          header: () => null,
          cell: ({ row }: { row: Row<JobReturnModel> }) => {
            if (!row.getCanExpand()) {
              return <></>;
            }
            return (
              <Button
                icon={row.getIsExpanded() ? <MinusSquareOutlined /> : <PlusSquareOutlined />}
                size="small"
                type="link"
                onClick={row.getToggleExpandedHandler()}
              ></Button>
            );
          },
        },
        columnHelper.accessor("id", {
          header: t("task.job-returns-table.table-mid"),
          cell: (data) => {
            return <span style={{ color: "#1677ff" }}>{data.row.original.minion_id}</span>;
          },
          meta: {
            showCopy: true,
            copyValue: (row) => row.minion_id,
            actions: [
              {
                icon: <ExportOutlined />,
                onClick: (value, row) => {
                  window.open(`/core/master/${row.salt_master}/minion/${row.minion_id}`, "_blank");
                },
                title: t("minions.open-in-new-tab"),
              },
            ],
            tdClassName: "fast-table-column-nowrap",
          },
        }),
        columnHelper.accessor("retcode", {
          header: t("task.job-returns-table.table-success"),
          cell: (data) => (
            <Tag color={data.getValue() === 0 ? "green" : "red"}>
              {data.getValue() === 0
                ? t("task.job-returns-table.table-yes")
                : t("task.job-returns-table.table-no")}
            </Tag>
          ),
        }),
        columnHelper.display({
          header: t("task.job-returns-table.table-return-code"),
          cell: (data) => data.row.original.retcode,
        }),
        columnHelper.accessor("stamp", {
          header: t("task.job-returns-table.table-execution-time"),
          cell: (data) => <RelativeTime date={data.getValue()} />,
        }),
        columnHelper.display({
          header: t("task.job-returns-table.table-execution-duration"),
          cell: ({ row }) => {
            return (
              <ExecutionDuration
                jobStartTimestamp={jobStartTimestamp?.toISOString()}
                stamp={row.original.stamp}
                jobReturn={row.original}
                jobReturns={jobReturns}
              />
            );
          },
        }),
      ],
      [t, jobStartTimestamp, jobReturns]
    );

    const renderStringData = (data: any) => {
      const stringValue = extractStringValue(data);

      return <div className={styles.stringDataContainer}>{stringValue}</div>;
    };

    const renderBooleanData = (data: any) => {
      return <div className={styles.stringDataContainer}>{data ? "True" : "False"}</div>;
    };

    const renderJobResult = useCallback(
      ({ row }: { row: Row<JobReturnModel> }) => {
        const dataToShow = isFullOutput ? row.original : getShortJobReturnOutput(row.original);

        if (!isFullOutput && isSimpleStringData(dataToShow)) {
          return renderStringData(dataToShow);
        }

        if (typeof dataToShow === "boolean") {
          return renderBooleanData(dataToShow);
        }

        const jsonValue =
          typeof dataToShow === "object" && dataToShow !== null
            ? dataToShow
            : { result: dataToShow };

        return (
          <div className={styles.reactJsonContainer}>
            <ReactJson
              displayDataTypes={false}
              enableClipboard={false}
              name={false}
              displayObjectSize={false}
              src={jsonValue as Record<string, unknown>}
              collapsed={isFullOutput ? 1 : 2}
            />
          </div>
        );
      },
      [isFullOutput]
    );

    const mergedTableData = useMemo(() => {
      if (!isTableViewMode) {
        return null;
      }

      const jobReturnsData = jobReturns.map((jobReturn) => ({
        data: jobReturn.data ?? null,
        minion_id: jobReturn.minion_id || "",
      }));

      const canConvertAny = jobReturnsData.some((jr) => canConvertToTable(jr.data));
      if (!canConvertAny) {
        return null;
      }

      return mergeJobReturnsToTable(jobReturnsData);
    }, [isTableViewMode, jobReturns]);

    useEffect(() => {
      if (!isTableViewMode || !onTableViewErrorsChange) return;
      onTableViewErrorsChange(mergedTableData?.errors || []);
    }, [isTableViewMode, mergedTableData?.errors, onTableViewErrorsChange]);

    const overscan = pagination.pageSize > 100 ? 10 : 100;

    if (
      isTableViewMode &&
      mergedTableData &&
      mergedTableData.canConvert &&
      mergedTableData.rows.length > 0
    ) {
      return (
        <div className={styles.jobReturnTableContainer}>
          <TableView
            data={mergedTableData}
            minionId=""
            onSortingChange={onTableViewSortingChange}
            onFilteredDataChange={onTableViewFilteredDataChange}
            onErrorsChange={onTableViewErrorsChange}
          />
        </div>
      );
    }

    return (
      <>
        <div className={styles.jobReturnTableContainer}>
          <JobReturnsTable
            columns={columns}
            getRowId={(row) => row.id}
            data={jobReturns}
            total={total}
            isLoading={isLoading}
            pagination={pagination}
            sorting={sorting}
            onLazyLoad={onLazyLoad}
            useVirtualScroll={false}
            overscan={overscan}
            forceExpandAll={forceExpand}
            getRowCanExpand={() => !isTableViewMode}
            renderSubComponent={renderJobResult}
            onRowClick={(jobReturn) => handleOpenDrawer(jobReturn.minion_id, jobReturn.salt_master)}
          />
        </div>

        <Drawer
          open={Boolean(drawerMinionId)}
          onClose={handleCloseDrawer}
          size="large"
          title={t("minions.minion")}
        >
          {minionStore && (
            <MinionDetails
              minion={minionStore.minion}
              isMinionLoading={minionStore.isMinionLoading}
              pillars={minionStore.pillars}
              isPillarsLoading={minionStore.isPillarsLoading}
              isInDrawer={true}
            />
          )}
        </Drawer>
      </>
    );
  }
);
