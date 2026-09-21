import { PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import {
  CreateJobRequestTgtTypeEnum,
  JobReturnModel,
  type MinionDetailSchema,
} from "@saltbox/saltbox-core-api-client";
import {
  FastTable,
  createExpanderColumn,
  FilterToggleButton,
  formatTimeByUserTZ,
  RefreshButton,
  useFiltersToggle,
  AcceptedMastersActionButton,
  type LoadSource,
} from "@saltbox/saltbox-frontend-common";
import {
  ColumnDef,
  createColumnHelper,
  PaginationState,
  Row,
  SortingState,
} from "@tanstack/react-table";
import { Flex, message } from "antd";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import {
  JobModalShell,
  useJobModalFlowState,
  type JobReplayBaseline,
} from "saltbox-core/features/job-modal";
import {
  JobReturnExecutionTime,
  JobReturnStatusTag,
} from "saltbox-core/shared/components/job-return";
import { JobReturnRow } from "saltbox-core/shared/components/job-return-row";
import { JsonPreview } from "saltbox-core/shared/components/json-preview";
import { getMinionJobReturnsFilterSchema } from "saltbox-core/shared/constants/filter-schemas";
import { JobFilterStore, JobStore, mastersStore } from "saltbox-core/store";

import { JobReturnsQueryBuilder } from "./job-returns-query-builder";
import styles from "./minion-job-returns-tab.module.css";

const jobReturnsColumnHelper = createColumnHelper<JobReturnModel>();
const JobReturnsTable = FastTable.Paginated<JobReturnModel>;
const minionJobReturnsSorting: SortingState = [{ id: "created", desc: true }];

interface JobReturnsConfig {
  jobReturns: JobReturnModel[];
  jobStore: JobStore;
  isLoading: boolean;
  loader?: LoadSource;
  pagination: PaginationState;
  sorting: SortingState;
  total: number;
  onLazyLoad: (pagination: PaginationState, sorting: SortingState) => void;
  onReplayJob: (row: JobReturnModel) => void;
}

interface MinionJobReturnsTableProps extends JobReturnsConfig {
  tableId: string;
}

interface MinionJobReturnsTabViewProps {
  jobReturnsConfig: JobReturnsConfig;
  isFullView?: boolean;
  jobReturnsTabActions?: React.ReactNode;
  jobReturnsFilter?: React.ReactNode;
}

const MinionJobReturnsTable = ({
  onLazyLoad,
  sorting,
  jobReturns,
  jobStore,
  isLoading,
  loader,
  total,
  pagination,
  onReplayJob,
  tableId,
}: MinionJobReturnsTableProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

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
                onReplayJob(row);
              },
              title: t("jobs.replay-job"),
            },
          ],
          color: "accent",
          width: "16%",
          minWidth: 250,
        },
      }),
      jobReturnsColumnHelper.accessor("status", {
        header: t("task.job-returns-table.table-status"),
        cell: (data) => (
          <JobReturnStatusTag status={data.getValue()} retcode={data.row.original.retcode} />
        ),
        meta: { width: "10%" },
      }),
      jobReturnsColumnHelper.accessor("fun", {
        header: t("task.job-returns-table.table-fun"),
        meta: { width: "14%", minWidth: 150 },
      }),
      jobReturnsColumnHelper.accessor("fun_args", {
        header: t("jobs.arguments"),
        cell: (data) => (
          <JsonPreview
            value={data.getValue()}
            title={t("jobs.arguments")}
            emptyLabel={t("jobs.no-arguments")}
          />
        ),
        meta: { width: "15%", minWidth: 200 },
      }),
      jobReturnsColumnHelper.accessor("fun_kwarg", {
        header: t("jobs.key-value-arguments"),
        cell: (data) => (
          <JsonPreview
            value={data.getValue()}
            title={t("jobs.key-value-arguments")}
            emptyLabel={t("jobs.no-key-value-arguments")}
          />
        ),
        meta: { width: "15%", minWidth: 200 },
      }),
      jobReturnsColumnHelper.accessor("stamp", {
        header: t("task.job-returns-table.table-execution-time"),
        cell: (data) => (
          <JobReturnExecutionTime stamp={data.getValue()} status={data.row.original.status} />
        ),
        meta: { width: "15%", minWidth: 170 },
      }),
      jobReturnsColumnHelper.accessor("created", {
        header: t("jobs.table-created"),
        cell: (data) => formatTimeByUserTZ(data.getValue()),
        meta: { width: "15%", minWidth: 170 },
      }),
    ],
    [onReplayJob, t]
  );

  const renderJobResult = useCallback(
    ({ row }: { row: Row<JobReturnModel> }) => (
      <JobReturnRow jobStore={jobStore} row={row.original} />
    ),
    [jobStore]
  );

  return (
    <div className={styles.jobReturnsTableWrapper}>
      <JobReturnsTable
        tableId={tableId}
        columns={columns}
        data={jobReturns}
        total={total}
        isLoading={isLoading}
        loader={loader}
        pagination={pagination}
        sorting={sorting}
        onLazyLoad={onLazyLoad}
        getRowId={(row) => row.id}
        onRowClick={(jobReturn) => handleNavigateToJob(jobReturn.job_id)}
        useVirtualScroll={false}
        renderSubComponent={renderJobResult}
        getRowCanExpand={() => true}
      />
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
      <FastTable.Provider>
        {isFullView && !!jobReturnsTabActions && (
          <div className="page-actions-buttons">
            {jobReturnsTabActions}
            <FastTable.Toolbar />
          </div>
        )}
        <MinionJobReturnsTable
          {...jobReturnsConfig}
          tableId={isFullView ? "core-minion-job-returns" : "core-minion-job-returns-drawer"}
        />
      </FastTable.Provider>
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
  const { t } = useTranslation();
  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();
  const { isOpen: shownFilters, toggle: toggleShownFilters } = useFiltersToggle(false);
  const [filtersExtraContainer, setFiltersExtraContainer] = useState<HTMLElement | null>(null);
  const [isManualRefreshLoading, setIsManualRefreshLoading] = useState(false);

  const jobStore = useMemo(() => new JobStore(minionJobReturnsSorting), []);
  const lastLoadedMinionIdRef = useRef<string | null>(null);

  const minionTargeting = useMemo(
    () => ({
      target: minion?.minion_id ?? "",
      targetType: CreateJobRequestTgtTypeEnum.Glob,
      defaultMaster: minion?.master ?? "",
    }),
    [minion?.master, minion?.minion_id]
  );

  const {
    pickerOpen,
    setPickerOpen,
    configureFunction,
    setConfigureFunction,
    targeting,
    setTargeting,
    openConfigureWithFunction,
  } = useJobModalFlowState(messageApi, minionTargeting);
  const [replayBaseline, setReplayBaseline] = useState<JobReplayBaseline | null>(null);

  useEffect(() => {
    setTargeting(minionTargeting);
  }, [minionTargeting, setTargeting]);

  const handleOpenCreateJob = useCallback(() => {
    setReplayBaseline(null);
    setTargeting(minionTargeting);
    setPickerOpen(true);
  }, [minionTargeting, setTargeting, setPickerOpen]);

  const handleReplayJob = useCallback(
    (row: JobReturnModel) => {
      if (!row.fun) {
        return;
      }
      setReplayBaseline({
        fun: row.fun,
        arg: row.fun_args ?? undefined,
        kwarg: row.fun_kwarg ?? undefined,
      });
      openConfigureWithFunction(row.fun, {
        target: row.minion_id ?? minionTargeting.target,
        targetType: CreateJobRequestTgtTypeEnum.Glob,
        defaultMaster: row.salt_master ?? minionTargeting.defaultMaster,
      });
    },
    [minionTargeting, openConfigureWithFunction]
  );

  const handleJobModalAfterConfigureClose = useCallback(() => {
    setReplayBaseline(null);
  }, []);

  const jobReturnsFilterSchema = useMemo(() => getMinionJobReturnsFilterSchema(t), [t]);
  const jobReturnsFilterStore = useMemo(
    () => new JobFilterStore([], `jobReturnsFilter:${minion?.id ?? "unknown"}`),
    [minion?.id]
  );

  useEffect(() => {
    jobReturnsFilterStore.updateFilterSchema(jobReturnsFilterSchema);
  }, [jobReturnsFilterSchema, jobReturnsFilterStore]);

  const handleJobReturnsFilterSearch = useCallback(() => {
    const minionId = minion?.minion_id;
    const masterId = minion?.master;
    if (!minionId || !masterId) return;

    jobStore.setMinionContext(minionId, masterId);
    jobStore.mongoDBQuery = jobReturnsFilterStore.searchMongoDBQuery;
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

    jobStore.setMinionContext(minionId, masterId);

    if (lastLoadedMinionIdRef.current === minionId) {
      return;
    }

    jobStore.mongoDBQuery = jobReturnsFilterStore.searchMongoDBQuery;
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

  const handleRefreshJobReturns = useCallback(async () => {
    setIsManualRefreshLoading(true);
    try {
      await jobStore.loadJobReturns();
    } finally {
      setIsManualRefreshLoading(false);
    }
  }, [jobStore]);

  const jobReturnsTabActions = isFullView ? (
    <Flex justify="flex-end">
      <AcceptedMastersActionButton
        type="primary"
        icon={<PlusOutlined />}
        messageApi={messageApi}
        navigate={navigate}
        checkHasAcceptedMasters={() => mastersStore.hasAcceptedMasters()}
        warningActionText={t("job-modal.warning-action.create-job")}
        onAction={handleOpenCreateJob}
      >
        {t("job-modal.create-job")}
      </AcceptedMastersActionButton>
      <RefreshButton
        loading={isManualRefreshLoading}
        onClick={handleRefreshJobReturns}
        title={t("minions.refresh")}
      />
    </Flex>
  ) : null;

  return (
    <>
      {contextHolder}
      {filtersExtraContainer && createPortal(jobReturnsFilterButton, filtersExtraContainer)}

      <MinionJobReturnsTabView
        jobReturnsConfig={{
          jobReturns: jobStore.jobReturns,
          jobStore,
          isLoading: jobStore.isJobReturnsLoading,
          loader: jobStore.jobReturnsLoad,
          pagination: jobStore.pagination,
          sorting: jobStore.sorting,
          total: jobStore.total,
          onLazyLoad: jobStore.handleLazyLoad,
          onReplayJob: handleReplayJob,
        }}
        isFullView={isFullView}
        jobReturnsTabActions={jobReturnsTabActions}
        jobReturnsFilter={jobReturnsFilter}
      />

      <JobModalShell
        pickerOpen={pickerOpen}
        onPickerOpenChange={setPickerOpen}
        configureFunction={configureFunction}
        onConfigureFunctionChange={setConfigureFunction}
        targeting={targeting}
        onTargetingChange={setTargeting}
        repeatBaseline={replayBaseline}
        onAfterConfigureClose={handleJobModalAfterConfigureClose}
      />
    </>
  );
});
