import { FilterOutlined, PlusOutlined, SyncOutlined } from "@ant-design/icons";
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
} from "@saltbox/saltbox-frontend-common";
import { createColumnHelper } from "@tanstack/react-table";
import { Button, Tag, message } from "antd";
import type { TFunction } from "i18next";
import { observer } from "mobx-react-lite";
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { RuleType } from "react-querybuilder";
import { useLocation, useNavigate } from "react-router";
import Parcel from "single-spa-react/parcel";

import { JobSourceType } from "saltbox-core/shared/components/job/source-type";
import { JobModalShell, type JobModalTargeting } from "saltbox-core/shared/components/job-modal";
import { useSaltTargetTypes } from "saltbox-core/shared/conf/salt-target-types";
import { getJobsFilterSchema } from "saltbox-core/shared/constants/filter-schemas";
import { appStore, JobFilterStore, JobsStore } from "saltbox-core/store";

import { JobDatetimeRangeSelector } from "./-components/job-datetime-range-selector";
import { JobsQueryBuilder } from "./-components/jobs-query-builder";
import { LaunchErrorPopover } from "./-components/launch-error-popover";
import styles from "./index.module.css";

const JobsTable = FastTablePaginated<JobsListResponse>;

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
          width: "12%",
          minWidth: 220,
          maxWidth: 220,
          ellipsis: true,
        },
      }),
      columnHelper.accessor("salt_master", {
        header: t("jobs.table-master"),
        meta: {
          width: "10%",
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
          width: "13%",
          minWidth: 230,
          maxWidth: 230,
          ellipsis: true,
          actions: [createFilterAction("tgt")],
        },
      }),
      columnHelper.accessor("tgt_type", {
        header: t("jobs.table-target-type"),
        meta: { width: "8%" },
      }),
      columnHelper.accessor((row) => row.source?.type, {
        id: "source.type",
        header: t("jobs.table-source"),
        cell: (data) => {
          return <JobSourceType type={data.getValue()} sourceId={data.row.original?.source?.id} />;
        },
        meta: {
          width: "11%",
          actions: [createFilterAction("source.type")],
        },
      }),
      columnHelper.accessor("user.name", {
        id: "user.name",
        header: t("jobs.table-user"),
        meta: {
          width: "11%",
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
                  errorTypeText={data.row.original.launch_error_type}
                  tagText={t("jobs.table-status-launch-error")}
                />
              );
            default:
              return <Tag>{`${t("jobs.table-status-unknown")}: ${data.getValue()}`}</Tag>;
          }
        },
        meta: {
          width: "11%",
          actions: [createFilterAction("status")],
        },
      }),
      columnHelper.accessor("created", {
        header: t("jobs.table-created"),
        cell: (data) => formatTimeByUserTZ(data.getValue()),
        meta: { width: "11%" },
      }),
    ],
    [t, createFilterAction]
  );

  useEffect(() => {
    if (jobsStore.error) {
      message.error(t("jobs.load-error"));
    }
  }, [jobsStore.error, t]);

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
        <Parcel config={plugin.parcel} wrapWith="div" />
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
          <Button type="primary" icon={<PlusOutlined />} onClick={openFunctionPicker}>
            {t("job-modal.create-job")}
          </Button>
        </div>
        <div className={styles.rightGroup}>
          <JobDatetimeRangeSelector
            label={t("jobs.date-range-label")}
            value={jobsStore.dateRangePreset}
            disabled={jobsStore.isJobsLoading}
            onChange={(range, preset) => {
              jobsStore.handleDateRangeChange(range, preset);
            }}
          />
          <Button
            icon={<SyncOutlined spin={jobsStore.isJobsLoading} />}
            onClick={() => jobsStore.refreshJobs()}
            title={t("jobs.refresh")}
            disabled={jobsStore.isJobsLoading}
          />
        </div>
      </div>

      <JobsTable
        columns={columns}
        getRowId={(row) => row.id}
        data={jobsStore.jobs}
        total={jobsStore.total}
        isLoading={jobsStore.isJobsLoading}
        pagination={jobsStore.pagination}
        sorting={jobsStore.sorting}
        onLazyLoad={(pagination, sorting) => jobsStore.handleLazyLoad(pagination, sorting)}
        onRowClick={(job) => handleNavigateToJob(job.jid)}
        useVirtualScroll={false}
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
