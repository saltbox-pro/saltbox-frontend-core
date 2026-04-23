import { ReloadOutlined } from "@ant-design/icons";
import { JobReturnModel, type MinionDetailSchema } from "@saltbox/saltbox-core-api-client";
import {
  createExpanderColumn,
  FastTablePaginated,
  FilterToggleButton,
  formatTimeByUserTZ,
  useFiltersToggle,
} from "@saltbox/saltbox-frontend-common";
import {
  ColumnDef,
  PaginationState,
  Row,
  SortingState,
  createColumnHelper,
} from "@tanstack/react-table";
import { Button, Flex, Tag } from "antd";
import { observer } from "mobx-react-lite";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import ReactJson from "react-json-view";
import { useNavigate } from "react-router";

import { JobModal } from "saltbox-core/shared/components/job-modal/job-modal";
import { JsonPopover } from "saltbox-core/shared/components/json-popover/json-popover";
import { JobReturnsQueryBuilder } from "saltbox-core/shared/components/minion-details/job-returns-query-builder";
import { retcodeLegacyValues, retcodeValues } from "saltbox-core/shared/conf/retcode-values";
import { JobFilterStore, JobStore } from "saltbox-core/store";

import {
  extractStringValue,
  getShortJobReturnOutput,
  isSimpleStringData,
} from "../job-return-table/utils/job-return-utils";

import styles from "./minion-job-returns-tab.module.css";

const jobReturnsColumnHelper = createColumnHelper<JobReturnModel>();
const JobReturnsTable = FastTablePaginated<JobReturnModel>;

interface JobReturnsConfig {
  jobReturns: JobReturnModel[];
  isLoading: boolean;
  pagination: PaginationState;
  sorting: SortingState;
  total: number;
  onLazyLoad: (pagination: PaginationState, sorting: SortingState) => void;
}

interface MinionJobReturnsTabViewProps {
  jobReturnsConfig: JobReturnsConfig;
  isFullView?: boolean;
  jobReturnsTabActions?: React.ReactNode;
  jobReturnsFilter?: React.ReactNode;
}

type MongoDBQuery = Record<string, unknown> & {
  retcode?: { $in?: Array<number | string> } | number | string | { $ne: number };
  $and?: Array<MongoDBQuery>;
  $or?: Array<MongoDBQuery>;
};

const defaultStringOperators = [
  { name: "=", value: "=", label: "=" },
  { name: "!=", value: "!=", label: "!=" },
  { name: "contains", value: "contains", label: "contains" },
  { name: "beginsWith", value: "beginsWith", label: "begins with" },
  { name: "endsWith", value: "endsWith", label: "ends with" },
  { name: "doesNotContain", value: "doesNotContain", label: "does not contain" },
  { name: "doesNotBeginWith", value: "doesNotBeginWith", label: "does not begin with" },
  { name: "doesNotEndWith", value: "doesNotEndWith", label: "does not end with" },
] as const;

const defaultDateTimeOperators = [
  { name: "<", value: "<", label: "<" },
  { name: ">", value: ">", label: ">" },
  { name: "<=", value: "<=", label: "<=" },
  { name: ">=", value: ">=", label: ">=" },
] as const;

const retcodeOperators = [{ name: "=", value: "=", label: "=" }] as const;

const jobReturnsFilterSchema = [
  { name: "jid", label: "JID", operators: defaultStringOperators },
  { name: "fun", label: "Function", operators: defaultStringOperators },
  { name: "retcode", label: "Return Code", operators: retcodeOperators },
  {
    name: "stamp",
    label: "Timestamp",
    operators: defaultDateTimeOperators,
    inputType: "datetime-local",
    valueEditorType: "datetime-local",
  },
];

const transformRetcodeValue = (retcode: unknown): number | { $ne: number } | undefined => {
  if (
    typeof retcode === "object" &&
    retcode !== null &&
    "$in" in retcode &&
    Array.isArray((retcode as any).$in)
  ) {
    const retcodeIn = (retcode as any).$in as Array<number | string>;
    const hasYes =
      retcodeIn.includes(retcodeLegacyValues.zero) ||
      retcodeIn.some((v) => String(v).toLowerCase() === retcodeValues.yes.toLowerCase());
    const hasNo =
      retcodeIn.includes(retcodeLegacyValues.notSuccess) ||
      retcodeIn.some((v) => String(v).toLowerCase() === retcodeValues.no.toLowerCase());

    if (hasYes === hasNo) return undefined;
    return hasNo ? { $ne: 0 } : 0;
  }

  const retcodeStr = String(retcode).toLowerCase();
  const isNo =
    retcodeStr === retcodeValues.no.toLowerCase() || retcode === retcodeLegacyValues.notSuccess;
  const isYes =
    retcodeStr === retcodeValues.yes.toLowerCase() ||
    retcode === retcodeLegacyValues.zero ||
    Number(retcode) === 0;

  if (isNo) return { $ne: 0 };
  if (isYes) return 0;
  return undefined;
};

const transformRetcodeFilter = (query: object): MongoDBQuery => {
  const mongoQuery = query as MongoDBQuery;
  const result: MongoDBQuery = {};

  if (mongoQuery?.retcode) {
    const transformedRetcode = transformRetcodeValue(mongoQuery.retcode);
    if (transformedRetcode !== undefined) {
      result.retcode = transformedRetcode;
    }
  }

  if (Array.isArray(mongoQuery.$and)) {
    const transformedAnd = mongoQuery.$and
      .map(transformRetcodeFilter)
      .filter((item) => Object.keys(item).length > 0);
    if (transformedAnd.length > 0) result.$and = transformedAnd;
  }

  if (Array.isArray(mongoQuery.$or)) {
    const transformedOr = mongoQuery.$or
      .map(transformRetcodeFilter)
      .filter((item) => Object.keys(item).length > 0);
    if (transformedOr.length > 0) result.$or = transformedOr;
  }

  Object.keys(mongoQuery).forEach((key) => {
    if (key !== "retcode" && key !== "$and" && key !== "$or") {
      result[key] = mongoQuery[key];
    }
  });

  return result;
};

const KwargsTag = ({
  data,
  title,
  copySuccessMessage,
  previewEntries,
  hasMore,
  isEmpty,
  formatValue,
  noKwargsText,
}: {
  data: Record<string, unknown> | undefined;
  title: string;
  copySuccessMessage: string;
  previewEntries: [string, unknown][];
  hasMore: boolean;
  isEmpty: boolean;
  formatValue: (value: unknown) => string;
  noKwargsText: string;
}) => {
  const tagContent = (
    <>
      <span className={styles.kwargsBrace}>{"{"}</span>
      {!isEmpty ? (
        previewEntries.map(([key, value], index) => (
          <Fragment key={key}>
            <span className={styles.kwargsKey}>{key}</span>
            <span className={styles.kwargsSeparator}>: </span>
            <span className={styles.kwargsValue}>{formatValue(value)}</span>
            {index < previewEntries.length - 1 && (
              <span className={styles.kwargsSeparator}>, </span>
            )}
          </Fragment>
        ))
      ) : (
        <span className={styles.kwargsEmpty}>{noKwargsText}</span>
      )}
      {hasMore ? <span className={styles.kwargsEllipsis}>…</span> : null}
      <span className={styles.kwargsBrace}>{"}"}</span>
    </>
  );

  if (isEmpty) {
    return <Tag className={styles.kwargsTag}>{tagContent}</Tag>;
  }

  return (
    <Button className={styles.kwargsPopoverWrapper} onClick={(e) => e.stopPropagation()}>
      <JsonPopover
        data={data ?? {}}
        title={title}
        copySuccessMessage={copySuccessMessage}
        maxHeight="400px"
        maxWidth="700px"
        placement="bottom"
        tagClassName={styles.kwargsTagClickable}
      >
        {tagContent}
      </JsonPopover>
    </Button>
  );
};

const MinionJobReturnsTable = (props: JobReturnsConfig) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedJobForReplay, setSelectedJobForReplay] = useState<JobReturnModel | null>(null);

  const handleNavigateToJob = useCallback(
    (jobId: string | null | undefined) => {
      if (!jobId) {
        return;
      }
      navigate(`/core/jobs/${jobId}`);
    },
    [navigate]
  );

  const columns = useMemo<ColumnDef<JobReturnModel>[]>(
    () => [
      createExpanderColumn(),
      jobReturnsColumnHelper.accessor("jid", {
        header: t("jobs.table-jid"),
        meta: {
          showCopy: true,
          actions: [
            {
              icon: <ReloadOutlined />,
              onClick: (_, row) => {
                setSelectedJobForReplay(row);
              },
              title: t("jobs.replay-job"),
            },
          ],
          color: "accent",
          width: 300,
          minWidth: 300,
          maxWidth: 350,
          ellipsis: true,
        },
      }),
      jobReturnsColumnHelper.accessor("retcode", {
        header: t("task.job-returns-table.table-success"),
        cell: (data) => (
          <Tag color={data.getValue() === 0 ? "green" : "red"}>
            {data.getValue() === 0
              ? t("task.job-returns-table.table-yes")
              : t("task.job-returns-table.table-no")}
          </Tag>
        ),
        meta: { width: 110 },
      }),
      jobReturnsColumnHelper.accessor("fun", {
        header: t("task.job-returns-table.table-fun"),
        meta: { width: "15%" },
      }),
      jobReturnsColumnHelper.accessor("fun_kwarg", {
        id: "fun_kwarg",
        header: t("jobs.key-value-arguments"),
        cell: (data) => {
          const rawKwargs = data.getValue();

          const isObjectKwargs =
            rawKwargs && typeof rawKwargs === "object" && !Array.isArray(rawKwargs);

          const kwargs = isObjectKwargs ? (rawKwargs as Record<string, unknown>) : undefined;
          const entries = kwargs ? Object.entries(kwargs) : [];
          const previewEntries = entries.slice(0, 3);
          const hasMore = entries.length > 3;
          const isEmpty = entries.length === 0;

          const formatValue = (value: unknown) => {
            if (value === null || typeof value === "number" || typeof value === "boolean") {
              return String(value);
            }

            if (typeof value === "string") {
              return value.length > 24 ? `${value.slice(0, 21)}…` : value;
            }

            if (Array.isArray(value)) {
              const items = value.slice(0, 3).map((item) => {
                if (typeof item === "string") {
                  return item.length > 12 ? `${item.slice(0, 9)}…` : item;
                }
                if (typeof item === "number" || typeof item === "boolean") {
                  return String(item);
                }
                return "…";
              });
              return `[${items.join(", ")}${value.length > 3 ? ", …" : ""}]`;
            }

            if (typeof value === "object") {
              return "{…}";
            }

            return "";
          };

          return (
            <KwargsTag
              data={kwargs}
              title={t("jobs.key-value-arguments")}
              copySuccessMessage={t("jobs.table-copy-success")}
              previewEntries={previewEntries}
              hasMore={hasMore}
              isEmpty={isEmpty}
              formatValue={formatValue}
              noKwargsText={t("jobs.no-key-value-arguments")}
            />
          );
        },
      }),
      jobReturnsColumnHelper.accessor("stamp", {
        header: t("task.job-returns-table.table-execution-time"),
        cell: (data) => formatTimeByUserTZ(data.getValue()),
      }),
    ],
    [handleNavigateToJob, t]
  );

  const renderJobResult = useCallback(({ row }: { row: Row<JobReturnModel> }) => {
    const dataToShow = getShortJobReturnOutput(row.original);

    if (isSimpleStringData(dataToShow)) {
      const stringValue = extractStringValue(dataToShow);
      return <div className={styles.stringDataContainer}>{stringValue}</div>;
    }

    if (typeof dataToShow === "boolean") {
      return <div className={styles.stringDataContainer}>{dataToShow ? "True" : "False"}</div>;
    }

    const jsonValue =
      typeof dataToShow === "object" && dataToShow !== null ? dataToShow : { result: dataToShow };

    return (
      <div className={styles.reactJsonContainer}>
        <ReactJson
          displayDataTypes={false}
          enableClipboard={false}
          name={false}
          displayObjectSize={false}
          src={jsonValue as Record<string, unknown>}
          collapsed={1}
        />
      </div>
    );
  }, []);

  return (
    <div className={styles.jobReturnsTableWrapper}>
      <JobReturnsTable
        columns={columns}
        data={props.jobReturns}
        total={props.total}
        isLoading={props.isLoading}
        pagination={props.pagination}
        sorting={props.sorting}
        onLazyLoad={props.onLazyLoad}
        getRowId={(row) => row.id}
        onRowClick={(jobReturn) => handleNavigateToJob(jobReturn.jid)}
        useVirtualScroll={false}
        renderSubComponent={renderJobResult}
        getRowCanExpand={() => true}
      />
      {selectedJobForReplay && (
        <JobModal
          key={selectedJobForReplay.jid}
          openOnMount
          onAfterClose={() => setSelectedJobForReplay(null)}
          target={selectedJobForReplay.minion_id}
          targetType="glob"
          fun={selectedJobForReplay.fun}
          arg={selectedJobForReplay.fun_args || undefined}
          kwarg={selectedJobForReplay.fun_kwarg || undefined}
          defaultMaster={selectedJobForReplay.salt_master}
        />
      )}
    </div>
  );
};

function MinionJobReturnsTabView({
  jobReturnsConfig,
  isFullView = false,
  jobReturnsTabActions,
  jobReturnsFilter,
}: MinionJobReturnsTabViewProps) {
  return (
    <Flex vertical className={styles.jobReturnsWrapper}>
      {jobReturnsFilter && <div className={styles.jobReturnsFilterWrapper}>{jobReturnsFilter}</div>}
      {isFullView && !!jobReturnsTabActions && (
        <div className="page-actions-buttons">{jobReturnsTabActions}</div>
      )}
      <MinionJobReturnsTable {...jobReturnsConfig} />
    </Flex>
  );
}

export const MinionJobReturnsTab = observer(function MinionJobReturnsTab({
  minion,
  isFullView = false,
}: {
  minion: MinionDetailSchema | null;
  isFullView?: boolean;
}) {
  const { isOpen: shownFilters, toggle: toggleShownFilters } = useFiltersToggle(false);
  const [filtersExtraContainer, setFiltersExtraContainer] = useState<HTMLElement | null>(null);

  const jobStore = useMemo(() => new JobStore(), []);
  const lastLoadedMinionIdRef = useRef<string | null>(null);

  const jobReturnsFilterStore = useMemo(() => {
    const storageKey = `jobReturnsFilter:${minion?.id ?? "unknown"}`;
    return new JobFilterStore(jobReturnsFilterSchema as any, storageKey);
  }, [minion?.id]);

  const handleJobReturnsFilterSearch = useCallback(() => {
    const minionId = minion?.minion_id;
    const masterId = minion?.master;

    if (!minionId || !masterId) return;

    const baseQuery = { minion_id: minionId, salt_master: masterId };
    const filterQuery = transformRetcodeFilter(jobReturnsFilterStore.searchMongoDBQuery);
    const hasFilters = filterQuery && Object.keys(filterQuery).length > 0;

    jobStore.mongoDBQuery = hasFilters ? { ...baseQuery, ...filterQuery } : baseQuery;
    jobStore.pagination.pageIndex = 0;
    jobStore.loadJobReturns();
  }, [jobReturnsFilterStore, jobStore, minion?.master, minion?.minion_id]);

  const handleJobReturnsFilterReset = useCallback(() => {
    jobReturnsFilterStore.handleResetFilters();
    handleJobReturnsFilterSearch();
  }, [handleJobReturnsFilterSearch, jobReturnsFilterStore]);

  useEffect(() => {
    jobStore.reset();
    lastLoadedMinionIdRef.current = null;
  }, [jobStore, minion?.id]);

  useEffect(() => {
    const minionId = minion?.minion_id;
    const masterId = minion?.master;
    if (!minionId || !masterId) return;

    if (lastLoadedMinionIdRef.current === minionId) {
      return;
    }

    const baseQuery = { minion_id: minionId, salt_master: masterId };
    const filterQuery = transformRetcodeFilter(jobReturnsFilterStore.searchMongoDBQuery);
    const hasFilters = filterQuery && Object.keys(filterQuery).length > 0;

    jobStore.mongoDBQuery = hasFilters ? { ...baseQuery, ...filterQuery } : baseQuery;
    jobStore.loadJobReturns();
    lastLoadedMinionIdRef.current = minionId;
  }, [jobReturnsFilterStore, jobStore, minion?.master, minion?.minion_id]);

  useEffect(() => {
    setFiltersExtraContainer(document.getElementById("minion-job-returns-filters-extra"));
  }, []);

  const jobReturnsFilterButton = (
    <FilterToggleButton
      isOpen={shownFilters}
      activeFiltersCount={jobReturnsFilterStore.activeFiltersCount}
      onToggle={toggleShownFilters}
    />
  );

  const jobReturnsFilter = shownFilters ? (
    <JobReturnsQueryBuilder
      filterStore={jobReturnsFilterStore}
      jobStore={jobStore}
      onSearchButtonClick={handleJobReturnsFilterSearch}
      onResetButtonClick={handleJobReturnsFilterReset}
    />
  ) : null;

  const jobReturnsTabActions = isFullView ? (
    <Flex justify="flex-end">
      <JobModal
        target={minion?.minion_id ?? ""}
        targetType="glob"
        defaultMaster={minion?.master ?? ""}
      />
    </Flex>
  ) : null;

  return (
    <>
      {filtersExtraContainer && createPortal(jobReturnsFilterButton, filtersExtraContainer)}

      <MinionJobReturnsTabView
        jobReturnsConfig={{
          jobReturns: jobStore.jobReturns,
          isLoading: jobStore.isJobReturnsLoading,
          pagination: jobStore.pagination,
          sorting: jobStore.sorting,
          total: jobStore.total,
          onLazyLoad: jobStore.handleLazyLoad,
        }}
        isFullView={isFullView}
        jobReturnsTabActions={jobReturnsTabActions}
        jobReturnsFilter={jobReturnsFilter}
      />
    </>
  );
});
