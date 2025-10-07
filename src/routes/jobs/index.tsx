import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router";
import { SortingState, createColumnHelper } from "@tanstack/react-table";
import dayjs from "dayjs";
import { observer } from "mobx-react-lite";
import { Breadcrumb, Button, Popover, Spin, Typography } from "antd";
import { HomeOutlined } from "@ant-design/icons";
import { JobsListResponse } from "@saltbox/saltbox-core-api-client";
import { CopyToClipboardButton } from "saltbox-core/shared/components/copy-to-clipboard-button/copy-to-clipboard-button";
import { JobModal } from "saltbox-core/shared/components/job-modal/job-modal";
import { saltTargetTypes } from "saltbox-core/shared/conf/salt-target-types";
import { useInfiniteScroll } from "saltbox-core/shared/hooks/useInfiniteScroll";
import {
  formatTimeByUserTZ,
  pastTimeByUserTZ,
  PageHeader,
  FastTableListed,
} from "@saltbox/saltbox-frontend-common";
import { apiCoreStore, appStore } from "saltbox-core/store";
import { JobFilterStore } from "saltbox-core/store";
import { JobsStore } from "saltbox-core/store";
import { JobDatetimeRangeSelector } from "./-components/job-datetime-range-selector";
import { JobsQueryBuilder } from "./-components/jobs-query-builder";
import styles from "./index.module.css";
import Parcel from "single-spa-react/parcel";
import { WebSocketService } from "@saltbox/saltbox-frontend-common";

const { Text } = Typography;

const JobsTable = FastTableListed<JobsListResponse>;

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
  const [sorting, setSorting] = useState<SortingState>([]);
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
  ], []);

  const { loadingRef } = useInfiniteScroll({
    onLoadMore: () => jobsStore.loadNextJobs(),
    hasMore: jobsStore.hasMoreJobs,
    isLoading: jobsStore.isJobsLoading,
    rootMargin: "10px",
  });

  useEffect(() => {
    webSocketService.connect(
      `${apiCoreStore.env?.ws_server_url}/jobs`,
      appStore.authStore?.user?.access_token,
      (update: JobsListResponse[]) => {
        if (update?.length > 0) {
          jobsStore.addJobs(update);
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
    jobsStore.handleDateRangeChange([dayjs().startOf("day"), dayjs()]);
  }, [jobsStore]);

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

      <JobsQueryBuilder filterStore={jobFilterStore} />

      <div className="page-actions-buttons">
        <JobModal target="*" targetType="glob" />

        <JobDatetimeRangeSelector
          className={styles.jobsDateRangePicker}
          label={t("jobs.date-range-label", {
            filtered: jobsStore.countFilteredJobs,
            loaded: jobsStore.countLoadedJobs,
            total: jobsStore.total,
          })}
          disabled={jobsStore.isJobsLoading}
          onChange={(value) => {
            jobsStore.handleDateRangeChange(value);
          }}
        />
      </div>

      <Spin
        spinning={
          jobsStore.isJobsLoading && jobsStore.filteredJobs.length === 0
        }
      >
        <JobsTable
          columns={columns}
          getRowId={(row) => row.jid}
          data={jobsStore.filteredJobs}
          sorting={sorting}
          onSortingChange={setSorting}
        />
      </Spin>

      <div
        ref={loadingRef}
        style={{ paddingBottom: "15px", textAlign: "center" }}
      >
        {jobsStore.isJobsLoading && jobsStore.filteredJobs.length > 0 && (
          <Spin />
        )}
      </div>

      {jobModalCreatePlugin}
    </>
  );
});

export default JobsPage;
