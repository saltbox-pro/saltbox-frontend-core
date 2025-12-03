import { ComponentProps, useMemo, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import ReactJson from "react-json-view";
import {
  OnChangeFn,
  PaginationState,
  Row,
  SortingState,
  createColumnHelper,
} from "@tanstack/react-table";
import { Button, Tag } from "antd";
import { MinusSquareOutlined, PlusSquareOutlined } from "@ant-design/icons";
import { Link } from "react-router";
import { JobReturnModel } from "@saltbox/saltbox-core-api-client";
import {
  CopyToClipboardButton,
  FastTablePaginated,
  formatTimeByUserTZ,
} from "@saltbox/saltbox-frontend-common";
import { useFormatAndGetExecutionTimeColor } from "../../../utils/execution-time-utils";
import {
  extractStringValue,
  getShortJobReturnOutput,
  isSimpleStringData,
} from "../utils/job-return-utils";
import { TableView } from "../table-view/table-view";
import { canConvertToTable, mergeJobReturnsToTable } from "../utils/table-converter";
import styles from "./default-job-return-table.module.css";

const columnHelper = createColumnHelper<JobReturnModel>();

const JobReturnsTable = FastTablePaginated<JobReturnModel>;

type OnLazyLoad = ComponentProps<typeof JobReturnsTable>["onLazyLoad"];

export const DefaultJobReturnTable = ({
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
}) => {
  const { t } = useTranslation();

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
              icon={
                row.getIsExpanded() ? (
                  <MinusSquareOutlined />
                ) : (
                  <PlusSquareOutlined />
                )
              }
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
          return (
            <>
              <Link
                to={`/master/${data.row.original.salt_master}/minion/${data.row.original.minion_id}`}
              >
                <Button type="link" size={"small"}>
                  {data.row.original.minion_id}
                </Button>
              </Link>
              <CopyToClipboardButton text={data.row.original.minion_id} />
            </>
          );
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
        header: t("task.job-returns-table.table-timestamp"),
        cell: (data) => {
          if (!data.getValue()) {
            return <></>;
          }
          const timestamp: string = formatTimeByUserTZ(data.getValue());
          return <div>{timestamp}</div>;
        },
      }),
      columnHelper.display({
        header: t("task.job-returns-table.table-execution-time"),
        cell: ({ row }) => {
          const stamp = row.original.stamp;
          const { formattedTime, color } = useFormatAndGetExecutionTimeColor(
            jobStartTimestamp?.toISOString() || null,
            stamp || null,
            jobReturns,
            t
          );

          return (
            <div className={styles.executionTimeValue} style={{ color }}>
              {formattedTime}
            </div>
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
    return (
      <div className={styles.stringDataContainer}>
        {data ? "True" : "False"}
      </div>
    );
  };

  const renderJobResult = useCallback(
    ({ row }: { row: Row<JobReturnModel> }) => {
      const dataToShow = isFullOutput
        ? row.original
        : getShortJobReturnOutput(row.original);

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

  const overscan = pagination.pageSize > 100 ? 10 : 100;

  if (isTableViewMode && mergedTableData && mergedTableData.canConvert && mergedTableData.rows.length > 0) {
    return (
      <div className={styles.jobReturnTableContainer}>
        <TableView
          data={mergedTableData}
          minionId=""
          onSortingChange={onTableViewSortingChange}
        />
      </div>
    );
  }

  return (
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
      />
    </div>
  );
};
