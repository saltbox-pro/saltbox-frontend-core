import { FilterOutlined } from "@ant-design/icons";
import { type JobsListResponse, JobStatus } from "@saltbox/saltbox-core-api-client";
import { FastTable, formatTimeByUserTZ, CellAction } from "@saltbox/saltbox-frontend-common";
import { createColumnHelper } from "@tanstack/react-table";
import { Tag } from "antd";
import { observer } from "mobx-react-lite";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { EntitySourceType } from "saltbox-core/shared/components/entity-source";
import {
  JOB_DATE_RANGE_PRESET,
  type JobDateRangePreset,
} from "saltbox-core/shared/constants/job-date-range-presets";
import type { JobsStore } from "saltbox-core/store";

import { LaunchErrorPopover } from "./cells/launch-error-popover";

const Table = FastTable.Paginated<JobsListResponse>;

const PRESET_TO_PERIOD_KEY: Record<JobDateRangePreset, string> = {
  [JOB_DATE_RANGE_PRESET.TODAY]: "jobs.period-today",
  [JOB_DATE_RANGE_PRESET.MINUTES_10]: "jobs.period-10-minutes",
  [JOB_DATE_RANGE_PRESET.MINUTES_30]: "jobs.period-30-minutes",
  [JOB_DATE_RANGE_PRESET.HOUR_1]: "jobs.period-1-hour",
  [JOB_DATE_RANGE_PRESET.HOUR_3]: "jobs.period-3-hours",
  [JOB_DATE_RANGE_PRESET.HOUR_12]: "jobs.period-12-hours",
  [JOB_DATE_RANGE_PRESET.DAY_1]: "jobs.period-1-day",
  [JOB_DATE_RANGE_PRESET.ALL_TIME]: "jobs.period-all-time",
};

const columnHelper = createColumnHelper<JobsListResponse>();

export interface JobsTableProps {
  store: JobsStore;
  tableId: string;
  hideMasterColumn?: boolean;
  onCellFilterClick?: () => void;
}

export const JobsTable = observer<JobsTableProps>(function JobsTable({
  store,
  tableId,
  hideMasterColumn,
  onCellFilterClick,
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const jobsEmptyText = useMemo(() => {
    const period = t(PRESET_TO_PERIOD_KEY[store.dateRangePreset]);
    return t("jobs.empty-for-period", { period });
  }, [store.dateRangePreset, t]);

  const handleNavigateToJob = useCallback(
    (jobId: string | null | undefined) => {
      if (!jobId) {
        return;
      }
      navigate(`/core/jobs/${jobId}`);
    },
    [navigate]
  );

  const createFilterAction = useCallback(
    (fieldName: string): CellAction<JobsListResponse> => ({
      icon: <FilterOutlined />,
      title: t("dashboard.apply-value-to-filters"),
      onClick: (value) => {
        onCellFilterClick?.();
        store.applyCellFilter(fieldName, value);
      },
    }),
    [onCellFilterClick, store, t]
  );

  const masterColumn = useMemo(
    () =>
      hideMasterColumn
        ? []
        : [
            columnHelper.accessor("salt_master", {
              header: t("jobs.table-master"),
              meta: {
                width: "11%",
                actions: [createFilterAction("salt_master")],
              },
            }),
          ],
    [createFilterAction, hideMasterColumn, t]
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor("jid", {
        header: t("jobs.table-jid"),
        meta: {
          showCopy: true,
          color: "accent",
          width: "13%",
          minWidth: 220,
        },
      }),
      ...masterColumn,
      columnHelper.accessor("fun", {
        header: t("jobs.table-function"),
        meta: {
          width: "10%",
          actions: [createFilterAction("fun")],
        },
      }),
      columnHelper.accessor("tgt", {
        header: t("jobs.table-targets"),
        meta: {
          showCopy: true,
          width: "15%",
          minWidth: 230,
          actions: [createFilterAction("tgt")],
        },
      }),
      columnHelper.accessor("tgt_type", {
        header: t("jobs.table-target-type"),
        meta: { width: "8%" },
      }),
      columnHelper.accessor((row) => row.source?.type, {
        id: "source.type",
        header: t("entity-source.column"),
        cell: (data) => {
          return (
            <EntitySourceType type={data.getValue()} sourceId={data.row.original?.source?.id} />
          );
        },
        meta: {
          width: "10%",
          actions: [createFilterAction("source.type")],
        },
      }),
      columnHelper.accessor("user.name", {
        id: "user.name",
        header: t("jobs.table-user"),
        meta: {
          width: "10%",
          actions: [createFilterAction("user.name")],
        },
      }),
      columnHelper.accessor("status", {
        header: t("jobs.table-status"),
        cell: (data) => {
          switch (data.getValue()) {
            case JobStatus.Starting:
              return <Tag color="yellow">{t("jobs.table-status-starting")}</Tag>;
            case JobStatus.Running:
              return <Tag color="blue">{t("jobs.table-status-running")}</Tag>;
            case JobStatus.Finished:
              return <Tag color="green">{t("jobs.table-status-finished")}</Tag>;
            case JobStatus.LaunchError:
              return (
                <LaunchErrorPopover
                  errorTypeText={data.row.original.launch_error_type ?? ""}
                  tagText={t("jobs.table-status-launch-error")}
                />
              );
            default:
              return <Tag>{`${t("jobs.table-status-unknown")}: ${data.getValue()}`}</Tag>;
          }
        },
        meta: {
          width: "11%",
          minWidth: 180,
          actions: [createFilterAction("status")],
        },
      }),
      columnHelper.accessor("created", {
        header: t("jobs.table-created"),
        cell: (data) => formatTimeByUserTZ(data.getValue()),
        meta: { width: "11%", minWidth: 170 },
      }),
    ],
    [t, createFilterAction, masterColumn]
  );

  return (
    <Table
      tableId={tableId}
      columns={columns}
      getRowId={(row) => row.id}
      data={store.jobs}
      total={store.total}
      isLoading={store.isJobsLoading}
      onRefresh={() => store.refreshJobs()}
      loader={store.jobsLoad}
      pagination={store.pagination}
      sorting={store.sorting}
      onLazyLoad={(pagination, sorting) => store.handleLazyLoad(pagination, sorting)}
      onRowClick={(job) => handleNavigateToJob(job.id)}
      useVirtualScroll={false}
      locale={{ empty: jobsEmptyText }}
    />
  );
});
