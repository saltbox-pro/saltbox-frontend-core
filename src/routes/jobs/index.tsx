import { JobsListResponse, JobStatus } from "@saltbox/saltbox-core-api-client";
import {
  FastTablePaginated,
  PageHeader,
  WebSocketMessage,
  WebSocketService,
  formatTimeByUserTZ,
} from "@saltbox/saltbox-frontend-common";
import { createColumnHelper } from "@tanstack/react-table";
import { Tag } from "antd";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router";
import Parcel from "single-spa-react/parcel";

import { JobSourceType } from "saltbox-core/shared/components/job/source-type";
import { JobModal } from "saltbox-core/shared/components/job-modal/job-modal";
import { useSaltTargetTypes } from "saltbox-core/shared/conf/salt-target-types";
import { getJobsFilterSchema } from "saltbox-core/shared/constants/filter-schemas";
import { apiCoreStore, appStore, JobFilterStore, JobsStore } from "saltbox-core/store";

import { JobDatetimeRangeSelector } from "./-components/job-datetime-range-selector";
import { JobsQueryBuilder } from "./-components/jobs-query-builder";
import { LaunchErrorPopover } from "./-components/launch-error-popover";
import styles from "./index.module.css";

const JobsTable = FastTablePaginated<JobsListResponse>;

const columnHelper = createColumnHelper<JobsListResponse>();

const useJobFilters = () => {
  const saltTargetTypes = useSaltTargetTypes();
  const location = useLocation();

  const filterSchema = useMemo(() => getJobsFilterSchema(saltTargetTypes), [saltTargetTypes]);

  const storageKey = `jobsFilter:${location.pathname}`;

  const [jobFilterStore] = useState(new JobFilterStore(filterSchema, storageKey));

  return {
    jobFilterStore,
  };
};

const JobsPage = observer(() => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [webSocketService] = useState(new WebSocketService<JobsListResponse>());

  const { jobFilterStore } = useJobFilters();
  const [jobsStore] = useState(new JobsStore(jobFilterStore));

  const handleNavigateToJob = useCallback(
    (jobId: string | null | undefined) => {
      if (!jobId) {
        return;
      }
      navigate(`/core/jobs/${jobId}`);
    },
    [navigate]
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
        meta: { width: "10%" },
      }),
      columnHelper.accessor("fun", {
        header: t("jobs.table-function"),
        meta: { width: "10%" },
      }),
      columnHelper.accessor("tgt", {
        header: t("jobs.table-targets"),
        meta: {
          showCopy: true,
          width: "13%",
          minWidth: 230,
          maxWidth: 230,
          ellipsis: true,
        },
      }),
      columnHelper.accessor("tgt_type", {
        header: t("jobs.table-target-type"),
        meta: { width: "8%" },
      }),
      columnHelper.accessor("source.type", {
        header: t("jobs.table-source"),
        cell: (data) => {
          return <JobSourceType type={data.getValue()} sourceId={data.row.original?.source?.id} />;
        },
        meta: { width: "11%" },
      }),
      columnHelper.accessor("user.name", {
        id: "user.name",
        header: t("jobs.table-user"),
        meta: { width: "11%" },
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
            case JobStatus.LaunchError: {
              return (
                <LaunchErrorPopover
                  errorTypeText={data.row.original.launch_error_type}
                  tagText={t("jobs.table-status-launch-error")}
                />
              );
            }
            default:
              return <Tag>{`${t("jobs.table-status-unknown")}: ${data.getValue()}`}</Tag>;
          }
        },
        meta: { width: "11%" },
      }),
      columnHelper.accessor("created", {
        header: t("jobs.table-created"),
        cell: (data) => formatTimeByUserTZ(data.getValue()),
        meta: { width: "11%" },
      }),
    ],
    [t]
  );

  useEffect(() => {
    webSocketService.connect(
      `${apiCoreStore.env?.ws_server_url}/jobs`,
      appStore.authStore?.user?.access_token,
      {
        onMessage: (messages: Array<WebSocketMessage<JobsListResponse>>) => {
          if (messages?.length > 0) {
            jobsStore.updateJobs(
              messages
                .filter((message) => message.message_tag === "job")
                .map((message) => message.payload)
            );
          }
        },
      }
    );
    return () => webSocketService.disconnect();
  }, []);

  useEffect(() => {
    if (webSocketService && appStore.authStore?.user?.access_token) {
      webSocketService.sendAccessToken(appStore.authStore.user.access_token);
    }
  }, [appStore.authStore?.user]);

  useEffect(() => {
    if (jobsStore.error) {
      navigate("/core/not-found");
    }
  }, [jobsStore.error]);

  useEffect(() => {
    jobsStore.mongoDBQuery = jobFilterStore.searchMongoDBQuery;
    jobsStore.loadJobs();
  }, []);

  let jobModalCreatePlugin: React.ReactNode = null;
  appStore.pluginsStore?.plugins?.["jobs.jobmodal.create"]?.forEach((plugin) => {
    jobModalCreatePlugin = (
      <>
        {jobModalCreatePlugin}
        <Parcel config={plugin.parcel} wrapWith="div" />
      </>
    );
  });

  const handleSearchButtonClick = () => {
    jobsStore.mongoDBQuery = jobFilterStore.searchMongoDBQuery;
    jobsStore.handleSearch();
  };

  const handleResetButtonClick = () => {
    jobFilterStore.handleResetFilters();
    jobsStore.mongoDBQuery = jobFilterStore.searchMongoDBQuery;
    jobsStore.handleSearch();
  };

  return (
    <>
      <PageHeader title={t("jobs.title")} />

      <JobsQueryBuilder
        filterStore={jobFilterStore}
        jobsStore={jobsStore}
        onSearchButtonClick={handleSearchButtonClick}
        onResetButtonClick={handleResetButtonClick}
      />

      <div className="page-actions-buttons">
        <JobModal target="*" targetType="glob" />

        <JobDatetimeRangeSelector
          className={styles.jobsDateRangePicker}
          label={t("jobs.date-range-label")}
          disabled={jobsStore.isJobsLoading}
          onChange={(value) => {
            jobsStore.handleDateRangeChange(value);
          }}
        />
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

      {jobModalCreatePlugin}
    </>
  );
});

export default JobsPage;
