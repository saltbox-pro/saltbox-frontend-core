import { MinusSquareOutlined, PlusSquareOutlined, ExportOutlined } from "@ant-design/icons";
import type { JobReturnModel } from "@saltbox/saltbox-core-api-client";
import { FastTablePaginated } from "@saltbox/saltbox-frontend-common";
import {
  type OnChangeFn,
  type PaginationState,
  type SortingState,
  type ColumnDef,
  createColumnHelper,
} from "@tanstack/react-table";
import { Button, Flex, Tag } from "antd";
import { observer } from "mobx-react-lite";
import { type ComponentProps, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";

import { RelativeTime } from "saltbox-core/shared/ui/time";
import { MinionDetailsDrawer, useMinionDrawer } from "saltbox-core/widgets/minion";

import { canConvertToTable, mergeJobReturnsToTable } from "../utils/table-converter";

import { ExecutionDuration } from "./components/execution-duration";
import { JobSubRow } from "./components/sub-row/job-sub-row";
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
    const minionDrawer = useMinionDrawer();

    const handleOpenMinionDrawer = async (minionId: string, masterId: string) => {
      await minionDrawer.openDrawer({
        masterId,
        minionId,
      });
    };

    const columns = useMemo<ColumnDef<JobReturnModel>[]>(
      () => [
        {
          id: "expander",
          cell: ({ row }) => {
            if (!row.getCanExpand()) return null;

            return (
              <Button
                icon={row.getIsExpanded() ? <MinusSquareOutlined /> : <PlusSquareOutlined />}
                size="small"
                type="link"
                onClick={row.getToggleExpandedHandler()}
              />
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
          id: "retcode-status",
          header: t("task.job-returns-table.table-success"),
          cell: (data) => (
            <Tag color={data.getValue() === 0 ? "green" : "red"}>
              {data.getValue() === 0
                ? t("task.job-returns-table.table-yes")
                : t("task.job-returns-table.table-no")}
            </Tag>
          ),
        }),
        columnHelper.accessor("retcode", {
          header: t("task.job-returns-table.table-return-code"),
          cell: (data) => data.getValue(),
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
              renderSubComponent={({ row }) => <JobSubRow row={row} isFullOutput={isFullOutput} />}
              onRowClick={(jobReturn) =>
                handleOpenMinionDrawer(jobReturn.minion_id, jobReturn.salt_master)
              }
            />
            <MinionDetailsDrawer
              isOpened={minionDrawer.isOpened}
              openedId={minionDrawer.openedId}
              minionStore={minionDrawer.minionStore}
              slug={minionDrawer.slug}
              error={minionDrawer.error}
              onClose={minionDrawer.closeDrawer}
              clearData={minionDrawer.clearData}
            />
          </>
        )}
      </Flex>
    );
  }
);
