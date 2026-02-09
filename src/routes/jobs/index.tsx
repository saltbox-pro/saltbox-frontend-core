import { JobsListResponse, JobStatus } from "@saltbox/saltbox-core-api-client";
import {
  FastTablePaginated,
  PageHeader,
  WebSocketMessage,
  WebSocketService,
  RelativeTime,
} from "@saltbox/saltbox-frontend-common";
import { createColumnHelper } from "@tanstack/react-table";
import { SelectProps, Tag } from "antd";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import Parcel from "single-spa-react/parcel";

import { JobModal } from "saltbox-core/shared/components/job-modal/job-modal";
import { useSaltTargetTypes } from "saltbox-core/shared/conf/salt-target-types";
import { apiCoreStore, appStore, JobFilterStore, JobsStore } from "saltbox-core/store";

import { JobDatetimeRangeSelector } from "./-components/job-datetime-range-selector";
import { JobsQueryBuilder } from "./-components/jobs-query-builder";
import styles from "./index.module.css";

const JobsTable = FastTablePaginated<JobsListResponse>;

const columnHelper = createColumnHelper<JobsListResponse>();

const defaultStringOperators = [
  {
    name: "=",
    value: "=",
    label: "=",
  },
  {
    name: "!=",
    value: "!=",
    label: "!=",
  },
  {
    name: "contains",
    value: "contains",
    label: "contains",
  },
  {
    name: "beginsWith",
    value: "beginsWith",
    label: "begins with",
  },
  {
    name: "endsWith",
    value: "endsWith",
    label: "ends with",
  },
  {
    name: "doesNotContain",
    value: "doesNotContain",
    label: "does not contain",
  },
  {
    name: "doesNotBeginWith",
    value: "doesNotBeginWith",
    label: "does not begin with",
  },
  {
    name: "doesNotEndWith",
    value: "doesNotEndWith",
    label: "does not end with",
  },
];

const defaultListOperators = [
  {
    name: "=",
    value: "=",
    label: "=",
  },
  {
    name: "!=",
    value: "!=",
    label: "!=",
  },
  {
    name: "in",
    value: "in",
    label: "in",
  },
  {
    name: "notIn",
    value: "notIn",
    label: "not in",
  },
];

const defaultDateTimeOperators = [
  {
    name: "<",
    value: "<",
    label: "<",
  },
  {
    name: ">",
    value: ">",
    label: ">",
  },
  {
    name: "<=",
    value: "<=",
    label: "<=",
  },
  {
    name: ">=",
    value: ">=",
    label: ">=",
  },
];

const getFilterSchema = (saltTargetTypes: SelectProps["options"]) => [
  {
    name: "jid",
    label: "JID",
    operators: defaultStringOperators,
  },
  {
    name: "fun",
    label: "Function",
    operators: defaultStringOperators,
  },
  {
    name: "tgt",
    label: "Targets",
    operators: defaultStringOperators,
  },
  {
    name: "tgt_type",
    label: "Target Type",
    operators: defaultListOperators,
    type: "multiselect",
    selectOptions: saltTargetTypes,
    selectFieldNames: { label: "label", value: "value" },
  },
  {
    name: "user.name",
    label: "User",
    operators: defaultStringOperators,
  },
  {
    name: "created",
    label: "Created",
    operators: defaultDateTimeOperators,
    inputType: "datetime-local",
    valueEditorType: "datetime-local",
  },
];

const useJobFilters = () => {
  const saltTargetTypes = useSaltTargetTypes();

  const filterSchema = useMemo(() => getFilterSchema(saltTargetTypes), [saltTargetTypes]);

  const [jobFilterStore] = useState(new JobFilterStore(filterSchema));

  useEffect(() => {
    jobFilterStore.updateFilterSchema(filterSchema);
  }, [filterSchema]);

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
      navigate(`/jobs/${jobId}`);
    },
    [navigate]
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor("jid", {
        header: t("jobs.table-jid"),
        cell: (data) => {
          const jid = data.getValue();
          if (!jid) {
            return "";
          }

          return <span style={{ color: "#1677ff" }}>{jid}</span>;
        },
        meta: {
          showCopy: true,
          tdClassName: "fast-table-column-nowrap",
        },
      }),
      columnHelper.accessor("fun", {
        header: t("jobs.table-function"),
      }),
      columnHelper.accessor("tgt", {
        header: t("jobs.table-targets"),
        cell: (data) => {
          const value = data.getValue();
          const fullValue = typeof value === "string" ? value : String(value ?? "");

          if (!fullValue || fullValue.length <= 2) {
            return fullValue;
          }

          const truncatedValue =
            fullValue.length > 50 ? `${fullValue.substring(0, 50)}...` : fullValue;

          return <span title={fullValue}>{truncatedValue}</span>;
        },
        meta: {
          showCopy: true,
        },
      }),
      columnHelper.accessor("tgt_type", {
        header: t("jobs.table-target-type"),
      }),
      columnHelper.accessor("user.name", {
        id: "user.name",
        header: t("jobs.table-user"),
      }),
      columnHelper.accessor("status", {
        header: t("jobs.table-status"),
        cell: (data) => {
          switch (data.getValue()) {
            case JobStatus.InQueue:
              return <Tag color="yellow">{t("jobs.table-status-in-queue")}</Tag>;
            case JobStatus.Started:
              return <Tag color="blue">{t("jobs.table-status-started")}</Tag>;
            case JobStatus.WaitingReturns:
              return <Tag color="lime">{t("jobs.table-status-waiting-returns")}</Tag>;
            case JobStatus.Finished:
              return <Tag color="green">{t("jobs.table-status-finished")}</Tag>;
            default:
              return <Tag>{`${t("jobs.table-status-unknown")}: ${data.getValue()}`}</Tag>;
          }
        },
      }),
      columnHelper.accessor("created", {
        header: t("jobs.table-created"),
        cell: (data) => <RelativeTime date={data.getValue()} />,
      }),
    ],
    [handleNavigateToJob, t]
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
      navigate("/not-found");
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
