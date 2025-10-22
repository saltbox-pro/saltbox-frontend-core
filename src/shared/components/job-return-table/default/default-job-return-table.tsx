import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import ReactJson from "react-json-view";
import { PaginationState, Row, SortingState, createColumnHelper } from "@tanstack/react-table";
import { Button, Tag } from "antd";
import { MinusSquareOutlined, PlusSquareOutlined } from "@ant-design/icons";
import { JobReturnModel } from "@saltbox/saltbox-core-api-client";
import {
  FastTablePaginated,
  formatTimeByUserTZ,
} from "@saltbox/saltbox-frontend-common";
import {
  calculateStatistics,
  getExecutionTimeColor,
  formatExecutionTime,
  TimeUnits,
} from "../../../utils/execution-time-utils";
import styles from "./default-job-return-table.module.css";
import { CopyToClipboardButton } from "saltbox-core/shared/components/copy-to-clipboard-button/copy-to-clipboard-button";
import { Link } from "react-router";

const columnHelper = createColumnHelper<JobReturnModel>();

const JobReturnsTable = FastTablePaginated<JobReturnModel>;

export const DefaultJobReturnTable = ({
  jobReturns,
  isFullOutput = false,
  isLoading = false,
  forceExpand,
  jobStartTimestamp,
  onExecutionTimesCalculated,
  pagination,
  sorting,
  total,
  onLazyLoad,
}: {
  jobReturns: JobReturnModel[];
  isFullOutput?: boolean;
  isLoading?: boolean;
  forceExpand?: boolean;
  jobStartTimestamp?: string | null;
  onExecutionTimesCalculated?: (executionTimes: number[]) => void;
  pagination: PaginationState;
  sorting: SortingState;
  total: number;
  onLazyLoad: (pagination: PaginationState, sorting: SortingState) => void;
}) => {
  const { t } = useTranslation();

  /* const jobReturnsWithExecutionTime = jobReturns.map((row) => {
    const startDate = new Date(jobStartTimestamp || 0);
    const endDate = new Date(row.stamp || 0);

    const executionTimeMs = endDate.getTime() - startDate.getTime();
    const executionTimeSeconds = executionTimeMs / 1000;

    return { ...row, executionTimeSeconds };
  });

  const executionTimes = jobReturnsWithExecutionTime
    .map((row) => row.executionTimeSeconds)
    .filter((time) => time > 0); */

  /* useEffect(() => {
    if (executionTimes.length > 0) {
      const maxExecutionTime = Math.max(...executionTimes);
      onExecutionTimesCalculated?.([maxExecutionTime]);
    } else {
      onExecutionTimesCalculated?.([0]);
    }
  }, [executionTimes, onExecutionTimesCalculated]); */

  /* const statistics = calculateStatistics(executionTimes); */
  const renderInvalidExecutionTime = (jobResult: JobReturnModel) => {
    const startDate = new Date(jobStartTimestamp || 0);
    const endDate = new Date(jobResult.stamp || 0);

    const startTime = startDate.toLocaleString("ru-RU", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const endTime = endDate.toLocaleString("ru-RU", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    return (
      <div className={styles.invalidExecutionTime}>
        {startTime} - {endTime}
      </div>
    );
  };

  const columns = useMemo(() => [
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
            <Button type="link" size={"small"}>
              {data.row.original.minion_id}
            </Button>
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
    /* columnHelper.display({
      header: t("task.job-returns-table.table-execution-time"),
      cell: ({ getValue, row }) => {
        const executionTimeSeconds = getValue();
        const jobResult = row.original;

        if (executionTimeSeconds <= 0) {
          return renderInvalidExecutionTime(jobResult);
        }

        const timeUnits: TimeUnits = {
          milliseconds: t("task.job-returns-table.time-units.milliseconds"),
          seconds: t("task.job-returns-table.time-units.seconds"),
          minutes: t("task.job-returns-table.time-units.minutes"),
          hours: t("task.job-returns-table.time-units.hours"),
        };

        const formattedTime = formatExecutionTime(
          executionTimeSeconds,
          timeUnits
        );
        const textColor = getExecutionTimeColor(
          executionTimeSeconds,
          statistics.mean,
          statistics.stdDev,
          statistics.min,
          statistics.max
        );

        return (
          <div
            className={styles.executionTimeValue}
            style={{ color: textColor }}
          >
            {formattedTime}
          </div>
        );
      },
    }), */
  ], [t]);

  const getShortOutput = (jobReturn: JobReturnModel) => {
    return jobReturn?.data ? jobReturn.data : jobReturn;
  };

  const isSimpleStringData = (data: any): boolean => {
    if (typeof data === "string") {
      return true;
    }

    if (typeof data === "object" && data !== null) {
      const keys = Object.keys(data);
      if (keys.length === 1) {
        const value = data[keys[0]];
        return typeof value === "string";
      }
    }

    return false;
  };

  const extractStringValue = (data: any): string => {
    if (typeof data === "string") {
      return data;
    }

    if (typeof data === "object" && data !== null) {
      const keys = Object.keys(data);
      if (keys.length === 1) {
        const value = data[keys[0]];
        if (typeof value === "string") {
          return value;
        }
      }
    }

    return "";
  };

  const renderStringData = (data: any) => {
    const stringValue = extractStringValue(data);

    return <div className={styles.stringDataContainer}>{stringValue}</div>;
  };

  const renderBooleanData = (data: any) => {
    return <div className={styles.stringDataContainer}>{data ? 'True' : 'False'}</div>;
  }

  const renderJobResult = ({ row }: { row: Row<JobReturnModel> }) => {
    const dataToShow = isFullOutput
      ? row.original
      : getShortOutput(row.original);

    if (!isFullOutput && isSimpleStringData(dataToShow)) {
      return renderStringData(dataToShow);
    }

    if (typeof dataToShow === 'boolean') {
      return renderBooleanData(dataToShow);
    }

    return (
      <div className={styles.reactJsonContainer}>
        <ReactJson
          displayDataTypes={false}
          enableClipboard={false}
          name={false}
          displayObjectSize={false}
          src={dataToShow}
          collapsed={isFullOutput ? 1 : 2}
        />
      </div>
    );
  };

  return (
    <JobReturnsTable
      columns={columns}
      getRowId={(row) => row.id}
      data={jobReturns}
      total={total}
      isLoading={isLoading}
      pagination={pagination}
      sorting={sorting}
      onLazyLoad={onLazyLoad}
      enableVirtualScroll={true}
      forceExpandAll={forceExpand}
      getRowCanExpand={() => true}
      renderSubComponent={renderJobResult}
    />
  );
};
