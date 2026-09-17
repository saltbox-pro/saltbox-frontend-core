import { FilterOutlined, PlusOutlined } from "@ant-design/icons";
import {
  type JobsListResponse,
  CreateJobRequestTgtTypeEnum,
  JobStatus,
} from "@saltbox/saltbox-core-api-client";
import {
  FastTablePaginated,
  PageHeader,
  formatTimeByUserTZ,
  CellAction,
  AcceptedMastersActionButton,
  RefreshButton,
} from "@saltbox/saltbox-frontend-common";
import { createColumnHelper } from "@tanstack/react-table";
import { Tag, message } from "antd";
import type { TFunction } from "i18next";
import { observer } from "mobx-react-lite";
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { RuleType } from "react-querybuilder";
import { useLocation, useNavigate } from "react-router";
import Parcel from "single-spa-react/parcel";

import { JobModalShell, type JobModalTargeting } from "saltbox-core/features/job-modal";
import { EntitySourceType } from "saltbox-core/shared/components/entity-source";
import { useSaltTargetTypes } from "saltbox-core/shared/conf/salt-target-types";
import { getJobsFilterSchema } from "saltbox-core/shared/constants/filter-schemas";
import {
  JOB_DATE_RANGE_PRESET,
  type JobDateRangePreset,
} from "saltbox-core/shared/constants/job-date-range-presets";
import { asParcelConfig } from "saltbox-core/shared/utils/as-parcel-config";
import { appStore, JobFilterStore, JobsStore, mastersStore } from "saltbox-core/store";

import { JobDatetimeRangeSelector } from "./-components/job-datetime-range-selector";
import { JobsQueryBuilder } from "./-components/jobs-query-builder";
import { LaunchErrorPopover } from "./-components/launch-error-popover";
import styles from "./index.module.css";

const JobsTable = FastTablePaginated<JobsListResponse>;

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

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isEmptyObject(value: unknown): boolean {
  return isPlainObject(value) && Object.keys(value).length === 0;
}

const useJobFilters = (t: TFunction) => {
  const saltTargetTypes = useSaltTargetTypes();
  const location = useLocation();

  const filterSchema = useMemo(() => getJobsFilterSchema(t, saltTargetTypes), [saltTargetTypes, t]);

  const storageKey = `jobsFilter:${location.pathname}`;

  const [jobFilterStore] = useState(new JobFilterStore(filterSchema, storageKey));

  useEffect(() => {
    jobFilterStore.updateFilterSchema(filterSchema);
  }, [filterSchema, jobFilterStore]);

  return {
    jobFilterStore,
  };
};

const JobsPage = observer(() => {
  const { t } = useTranslation();
  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();
  const location = useLocation();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [configureFunction, setConfigureFunction] = useState<string | null>(null);
  const [targeting, setTargeting] = useState<JobModalTargeting>({
    target: "*",
    targetType: CreateJobRequestTgtTypeEnum.Glob,
    defaultMaster: "",
  });

  const { jobFilterStore } = useJobFilters(t);
  const [jobsStore] = useState(new JobsStore(jobFilterStore));
  const didInitFromLocationRef = useRef(false);
  const [isFilterButtonClick, setIsFilterButtonClick] = useState(false);

  const jobsEmptyText = useMemo(() => {
    const period = t(PRESET_TO_PERIOD_KEY[jobsStore.dateRangePreset]);
    return t("jobs.empty-for-period", { period });
  }, [jobsStore.dateRangePreset, t]);

  const handleNavigateToJob = useCallback(
    (jobId: string | null | undefined) => {
      if (!jobId) {
        return;
      }
      navigate(`/core/jobs/${jobId}`);
    },
    [navigate]
  );

  const handleCellFilterClick = useCallback(
    (fieldName: string, value: unknown) => {
      setIsFilterButtonClick(true);

      const [operator, ruleValue]: ["=" | "in", string] = Array.isArray(value)
        ? ["in", value.join(",")]
        : ["=", String(value ?? "")];

      const newRule: RuleType = {
        field: fieldName,
        operator,
        value: ruleValue,
      };

      jobFilterStore.handleFiltersChange({
        combinator: "and",
        rules: [
          ...jobFilterStore.currentFilters.rules.filter(
            (r) => "field" in r && r.field !== fieldName
          ),
          newRule,
        ],
      });

      jobFilterStore.handleSearch();
      jobsStore.syncDateRangeWithAppliedFilters();
      jobsStore.mongoDBQuery = jobFilterStore.searchMongoDBQuery;
      jobsStore.handleSearch();
    },
    [jobFilterStore, jobsStore]
  );

  const createFilterAction = useCallback(
    (fieldName: string): CellAction<JobsListResponse> => ({
      icon: <FilterOutlined />,
      title: t("dashboard.apply-value-to-filters"),
      onClick: (value) => handleCellFilterClick(fieldName, value),
    }),
    [handleCellFilterClick, t]
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
      columnHelper.accessor("salt_master", {
        header: t("jobs.table-master"),
        meta: {
          width: "11%",
          actions: [createFilterAction("salt_master")],
        },
      }),
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
    [t, createFilterAction]
  );

  useEffect(() => {
    if (didInitFromLocationRef.current) {
      return;
    }

    const stateQuery = location.state;
    if (isPlainObject(stateQuery)) {
      jobFilterStore.initializeByQuery(stateQuery);
      navigate(location.pathname, { replace: true, state: null });
    }

    jobsStore.syncDateRangeWithAppliedFilters();

    const parsedQuery = jobFilterStore.searchMongoDBQuery;
    jobsStore.mongoDBQuery =
      isPlainObject(stateQuery) && !isEmptyObject(stateQuery) && isEmptyObject(parsedQuery)
        ? stateQuery
        : parsedQuery;
    jobsStore.loadJobs();
    didInitFromLocationRef.current = true;
  }, [jobFilterStore, jobsStore, location.pathname, location.state, navigate]);

  let jobModalCreatePlugin: ReactNode = null;
  appStore.pluginsStore?.plugins?.["jobs.jobmodal.create"]?.forEach((plugin) => {
    jobModalCreatePlugin = (
      <>
        {jobModalCreatePlugin}
        <Parcel config={asParcelConfig(plugin.parcel)} wrapWith="div" />
      </>
    );
  });

  const handleSearchButtonClick = () => {
    jobsStore.syncDateRangeWithAppliedFilters();
    jobsStore.mongoDBQuery = jobFilterStore.searchMongoDBQuery;
    jobsStore.handleSearch();
  };

  const handleResetButtonClick = () => {
    jobFilterStore.handleResetFilters();
    jobsStore.syncDateRangeWithAppliedFilters();
    jobsStore.mongoDBQuery = jobFilterStore.searchMongoDBQuery;
    jobsStore.handleSearch();
  };

  const openFunctionPicker = useCallback(() => {
    setTargeting({
      target: "*",
      targetType: CreateJobRequestTgtTypeEnum.Glob,
      defaultMaster: "",
    });
    setPickerOpen(true);
  }, []);

  return (
    <>
      {contextHolder}
      <PageHeader title={t("jobs.title")} />

      <JobsQueryBuilder
        filterStore={jobFilterStore}
        jobsStore={jobsStore}
        onSearchButtonClick={handleSearchButtonClick}
        onResetButtonClick={handleResetButtonClick}
        isFilterButton={isFilterButtonClick}
        onFilterButtonApplied={() => setIsFilterButtonClick(false)}
      />

      <div className="page-actions-buttons">
        <div className={styles.leftGroup}>
          <AcceptedMastersActionButton
            type="primary"
            icon={<PlusOutlined />}
            messageApi={messageApi}
            navigate={navigate}
            checkHasAcceptedMasters={() => mastersStore.hasAcceptedMasters()}
            warningActionText={t("job-modal.warning-action.create-job")}
            onAction={openFunctionPicker}
          >
            {t("job-modal.create-job")}
          </AcceptedMastersActionButton>
        </div>
        <div className={styles.rightGroup}>
          <JobDatetimeRangeSelector
            label={t("jobs.date-range-label")}
            value={jobsStore.dateRangePreset}
            disabled={jobsStore.isJobsLoading}
            onChange={(createdSince, preset) => {
              jobsStore.handleDateRangeChange(createdSince, preset);
            }}
          />
          <RefreshButton
            loading={jobsStore.isJobsLoading}
            onClick={() => jobsStore.refreshJobs()}
            title={t("jobs.refresh")}
            disabled={jobsStore.isJobsLoading}
          />
        </div>
      </div>

      <JobsTable
        tableId="core-jobs"
        columns={columns}
        getRowId={(row) => row.id}
        data={jobsStore.jobs}
        total={jobsStore.total}
        isLoading={jobsStore.isJobsLoading}
        loader={jobsStore.jobsLoad}
        pagination={jobsStore.pagination}
        sorting={jobsStore.sorting}
        onLazyLoad={(pagination, sorting) => jobsStore.handleLazyLoad(pagination, sorting)}
        onRowClick={(job) => handleNavigateToJob(job.id)}
        useVirtualScroll={false}
        locale={{ empty: jobsEmptyText }}
      />

      <JobModalShell
        pickerOpen={pickerOpen}
        onPickerOpenChange={setPickerOpen}
        configureFunction={configureFunction}
        onConfigureFunctionChange={setConfigureFunction}
        targeting={targeting}
        onTargetingChange={setTargeting}
      />

      {jobModalCreatePlugin}
    </>
  );
});

export default JobsPage;
