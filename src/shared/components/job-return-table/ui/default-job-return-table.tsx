import { ExportOutlined } from "@ant-design/icons";
import type { JobReturnModel } from "@saltbox/saltbox-core-api-client";
import {
  createExpanderColumn,
  FastTablePaginated,
  formatTimeByUserTZ,
  useInfoDrawer,
} from "@saltbox/saltbox-frontend-common";
import {
  type OnChangeFn,
  type PaginationState,
  type SortingState,
  type ColumnDef,
  createColumnHelper,
} from "@tanstack/react-table";
import { Flex, Tag, Typography } from "antd";
import { observer } from "mobx-react-lite";
import { type ComponentProps, useMemo, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";

import { JobReturnRow } from "saltbox-core/shared/components/job-return-row";
import {
  MinionDetailsDrawer,
  type MinionDetailsDrawerOpenParams,
} from "saltbox-core/widgets/minion-details-drawer";

import { canConvertToTable, mergeJobReturnsToTable } from "../utils/table-converter";

import { ExecutionDuration } from "./components/execution-duration";
import { TableView } from "./components/table-view/table-view";
import styles from "./default-job-return-table.module.css";

const columnHelper = createColumnHelper<JobReturnModel>();

const JobReturnsTable = FastTablePaginated<JobReturnModel>;

type OnLazyLoad = ComponentProps<typeof JobReturnsTable>["onLazyLoad"];

interface DefaultJobReturnTableProps {
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
}

export const DefaultJobReturnTable = observer<DefaultJobReturnTableProps>(
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
  }) => {
    const { t } = useTranslation();
    const drawer = useInfoDrawer<MinionDetailsDrawerOpenParams, string, HTMLTableSectionElement>({
      getId: (params) => params.drawerId ?? params.minionId,
    });

    const columns = useMemo<ColumnDef<JobReturnModel>[]>(
      () => [
        createExpanderColumn<JobReturnModel>(),
        columnHelper.accessor("id", {
          header: t("task.job-returns-table.table-mid"),
          cell: (data) => {
            return data.row.original.minion_id;
          },
          meta: {
            showCopy: true,
            copyValue: (row) => row.minion_id,
            actions: [
              {
                icon: <ExportOutlined />,
                onClick: (_, row) => {
                  window.open(`/core/masters/${row.salt_master}/minion/${row.minion_id}`, "_blank");
                },
                title: t("minions.open-in-new-tab"),
              },
            ],
            color: "accent",
            minWidth: 300,
            ellipsis: true,
          },
        }),
        columnHelper.accessor("status", {
          id: "status",
          header: t("task.job-returns-table.table-status"),
          cell: (data) => {
            const status = data.getValue() as string | undefined;
            const retcode = data.row.original.retcode;

            if (!status && retcode === undefined) {
              return <Tag>{t("task.job-returns-table.status-unknown")}</Tag>;
            }

            if (status === "waiting") {
              return <Tag color="blue">{t("task.job-returns-table.status-waiting")}</Tag>;
            }

            if (status === "timeout") {
              return <Tag color="orange">{t("task.job-returns-table.status-timeout")}</Tag>;
            }

            if (status === "ignored") {
              return <Tag>{t("task.job-returns-table.status-ignored")}</Tag>;
            }

            if (status === "success" || retcode === 0) {
              return <Tag color="green">{t("task.job-returns-table.status-success")}</Tag>;
            }

            if (status === "failed" || (retcode !== undefined && retcode !== 0)) {
              return <Tag color="red">{t("task.job-returns-table.status-failed")}</Tag>;
            }

            return <Tag>{status}</Tag>;
          },
          meta: { width: 140 },
        }),
        columnHelper.accessor("retcode", {
          id: "retcode",
          header: t("task.job-returns-table.table-return-code"),
          meta: { width: 150 },
        }),
        columnHelper.accessor("stamp", {
          header: t("task.job-returns-table.table-execution-time"),
          cell: (data) => {
            const stamp = data.getValue();
            const status = data.row.original.status;
            if (status === "timeout") {
              return (
                <Typography.Text type="secondary">
                  {t("task.job-returns-table.status-timeout")}
                </Typography.Text>
              );
            }
            if (status === "ignored") {
              return (
                <Typography.Text type="secondary">
                  {t("task.job-returns-table.status-ignored")}
                </Typography.Text>
              );
            }
            if (stamp == null || stamp === "") {
              return (
                <Typography.Text type="secondary">
                  {t("task.job-returns-table.execution-time-pending")}
                </Typography.Text>
              );
            }
            return formatTimeByUserTZ(stamp);
          },
          meta: { width: "18%" },
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
          meta: { width: "18%" },
        }),
      ],
      [t, jobStartTimestamp, jobReturns]
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

    const handleRowClick = useCallback(
      (jobReturn: JobReturnModel) => {
        drawer.toggle({
          masterId: jobReturn.salt_master,
          minionId: jobReturn.minion_id,
          drawerId: jobReturn.id,
        });
      },
      [drawer]
    );

    const overscan = pagination.pageSize > 100 ? 10 : 100;
    const shouldShowMergedView =
      isTableViewMode &&
      mergedTableData &&
      mergedTableData.canConvert &&
      mergedTableData.rows.length > 0;

    useEffect(() => {
      if (!isTableViewMode || !onTableViewErrorsChange) return;
      onTableViewErrorsChange(mergedTableData?.errors || []);
    }, [isTableViewMode, mergedTableData?.errors, onTableViewErrorsChange]);

    return (
      <Flex vertical className={styles.jobReturnTableContainer}>
        {shouldShowMergedView ? (
          <TableView
            data={mergedTableData}
            minionId=""
            onSortingChange={onTableViewSortingChange}
            onFilteredDataChange={onTableViewFilteredDataChange}
            onErrorsChange={onTableViewErrorsChange}
          />
        ) : (
          <>
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
              renderSubComponent={({ row }) => (
                <JobReturnRow row={row} isFullOutput={isFullOutput} />
              )}
              activeRowId={drawer.activeRowId}
              bodyRef={drawer.mainContentRef}
              onRowClick={handleRowClick}
            />
          </>
        )}

        <MinionDetailsDrawer drawer={drawer} />
      </Flex>
    );
  }
);
