import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router";
import { createColumnHelper } from "@tanstack/react-table";
import { observer } from "mobx-react-lite";
import { Breadcrumb, Button, Tag, Typography } from "antd";
import { HomeOutlined } from "@ant-design/icons";
import { JobsListResponse, JobStatus } from "@saltbox/saltbox-core-api-client";
import { JobModal } from "saltbox-core/shared/components/job-modal/job-modal";
import { saltTargetTypes } from "saltbox-core/shared/conf/salt-target-types";
import {
  formatTimeByUserTZ,
  pastTimeByUserTZ,
  PageHeader,
  FastTablePaginated,
  Popover,
  CopyToClipboardButton,
} from "@saltbox/saltbox-frontend-common";
import { apiCoreStore, appStore, JobFilterStore, JobsStore } from "saltbox-core/store";
import { JobDatetimeRangeSelector } from "./-components/job-datetime-range-selector";
import { JobsQueryBuilder } from "./-components/jobs-query-builder";
import Parcel from "single-spa-react/parcel";
import { WebSocketService } from "@saltbox/saltbox-frontend-common";
import styles from "./index.module.css";

const { Text } = Typography;

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

const filterSchema = [
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

const JobsPage = observer(() => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [webSocketService] = useState(new WebSocketService<JobsListResponse>());

  const [jobFilterStore] = useState(new JobFilterStore(filterSchema));
  const [jobsStore] = useState(new JobsStore(jobFilterStore));

  const columns = useMemo(() => [
    columnHelper.accessor("jid", {
      header: t("jobs.table-jid"),
      cell: (data) => {
        const result = useMemo(() => <>
          <Link to={`/job/${data.getValue()}`}>
            <Button type="link" size={"small"}>
              {data.getValue()}
            </Button>
          </Link>
          <CopyToClipboardButton text={data.getValue()} />
        </>, []);
        return result;
      },
      meta: {
        tdClassName: "fast-table-column-nowrap",
      },
    }),
    columnHelper.accessor("fun", {
      header: t("jobs.table-function"),
    }),
    columnHelper.accessor("tgt", {
      header: t("jobs.table-targets"),
      cell: (data) => {
        const fullValue = data.getValue() as string;
        if (fullValue?.length <= 2) {
          return fullValue;
        }

        const truncatedValue =
          fullValue.length > 50
            ? `${fullValue.substring(0, 50)}...`
            : fullValue;

        const result = useMemo(() => (
          <Text copyable={{ text: fullValue }} title={fullValue}>
            {truncatedValue}
          </Text>
        ), []);

        return result;
      },
    }),
    columnHelper.accessor("tgt_type", {
      header: t("jobs.table-target-type"),
    }),
    columnHelper.accessor("user.name", {
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
            return (
              <Tag>{`${t(
                "jobs.table-status-unknown"
              )}: ${data.getValue()}`}</Tag>
            );
        }
      }
    }),
    columnHelper.accessor("fms_jid_timestamp", {
      header: t("jobs.table-created"),
      cell: (data) => {
        if (!data.getValue()) return "";

        const rawCreated = data.getValue();
        const created: string = formatTimeByUserTZ(rawCreated);
        const createdPastTime: string = pastTimeByUserTZ(rawCreated);

        const result = useMemo(() => (
          <Popover content={created}>{createdPastTime}</Popover>
        ), []);

        return result;
      },
    }),
  ], [t]);

  useEffect(() => {
    webSocketService.connect(
      `${apiCoreStore.env?.ws_server_url}/jobs`,
      appStore.authStore?.user?.access_token,
      (update: JobsListResponse[]) => {
        if (update?.length > 0) {
          jobsStore.updateJobs(update);
        }
      },
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
    jobsStore.loadJobs();
  }, []);

  let jobModalCreatePlugin: React.ReactNode = null;
  appStore.pluginsStore?.plugins?.["jobs.jobmodal.create"]?.forEach(
    (plugin) => {
      jobModalCreatePlugin = (
        <>
          {jobModalCreatePlugin}
          <Parcel config={plugin.parcel} wrapWith="div" />
        </>
      );
    }
  );

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
      <Breadcrumb
        items={[
          {
            href: "/",
            title: <HomeOutlined />,
          },
          {
            title: t("jobs.title"),
          },
        ]}
      />
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
        enableVirtualScroll={true}
      />

      {jobModalCreatePlugin}
    </>
  );
});

export default JobsPage;
