import { ReloadOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import {
  CreateJobRequestTgtTypeEnum,
  JobModel,
  JobReturnModel,
  JobStatus,
} from "@saltbox/saltbox-core-api-client";
import {
  CopyToClipboardButton,
  PageHeader,
  WebSocketMessage,
  WebSocketService,
} from "@saltbox/saltbox-frontend-common";
import type { SortingState } from "@tanstack/react-table";
import { Button, Flex, Modal, Radio, Skeleton, Spin, Statistic, Tag, Typography } from "antd";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import Parcel from "single-spa-react/parcel";

import { JobStatusProgress } from "saltbox-core/routes/jobs.$jid/-components/job-status-progress";
import {
  JobModalShell,
  type JobModalTargeting,
} from "saltbox-core/shared/components/job-modal/job-modal-shell";
import {
  DefaultJobReturnTable,
  exportToCSV,
  mergeJobReturnsToTable,
} from "saltbox-core/shared/components/job-return-table";
import { JsonPreview } from "saltbox-core/shared/components/json-preview";
import { useDocumentEvent } from "saltbox-core/shared/hooks/useDocumentEvent";
import { formatExecutionTime } from "saltbox-core/shared/utils/execution-time-utils";
import { apiCoreStore, appStore, jobStore } from "saltbox-core/store";

import { ErrorsPopover } from "./-components/errors-popover";
import styles from "./index.module.css";

const { Text } = Typography;
const { Timer } = Statistic;

type JobWebSocketMessage = JobModel | JobReturnModel;

const JobPage = observer(() => {
  const { t } = useTranslation();
  const { jid } = useParams();
  const navigate = useNavigate();

  const [webSocketService] = useState(new WebSocketService<JobWebSocketMessage>());
  const [isWebSocketConnecting, setIsWebSocketConnecting] = useState(false);
  const [viewMode, setViewMode] = useState<"standard" | "detailed" | "table">("standard");
  const [tableViewSorting, setTableViewSorting] = useState<SortingState>([]);
  const [filteredTableRows, setFilteredTableRows] = useState<Record<string, unknown>[]>([]);
  const [tableErrors, setTableErrors] = useState<Array<{ minion_id: string; error: string }>>([]);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [tablePagination, setTablePagination] = useState({ pageIndex: 1, pageSize: 50 });
  const savedPageSizeRef = useRef<number | null>(null);

  const isFullOutput = viewMode === "detailed";
  const isTableViewMode = viewMode === "table";

  const [repeatPickerOpen, setRepeatPickerOpen] = useState(false);
  const [repeatConfigureFun, setRepeatConfigureFun] = useState<string | null>(null);
  const [repeatTargeting, setRepeatTargeting] = useState<JobModalTargeting>({
    target: "*",
    targetType: CreateJobRequestTgtTypeEnum.Glob,
    defaultMaster: "",
  });

  useEffect(() => {
    setRepeatConfigureFun(null);
    setRepeatPickerOpen(false);
  }, [jid]);

  const effectiveJobReturns = jid && jobStore.jid === jid ? jobStore.jobReturns : [];
  const statusCounts = jobStore.jobReturnStatusCounts;
  const formatJobDuration = (seconds: number): string => {
    return formatExecutionTime(seconds, t);
  };
  const isCommandInitializing = jobStore.job != null && jobStore.job.status === JobStatus.Starting;
  const showJobBodyLoader = isWebSocketConnecting || jobStore.isJobLoading || isCommandInitializing;
  const showJobReturnsToolbar =
    jobStore.totalMinions > 0 || jobStore.total > 0 || effectiveJobReturns.length > 0;

  const tableConversionCheck = useMemo(() => {
    const jobReturnsData = effectiveJobReturns.map((jobReturn) => ({
      data: jobReturn.data ?? null,
      minion_id: jobReturn.minion_id || "",
    }));

    return mergeJobReturnsToTable(jobReturnsData);
  }, [effectiveJobReturns]);

  const mergedTableData = useMemo(() => {
    if (!isTableViewMode) {
      return null;
    }

    return tableConversionCheck;
  }, [isTableViewMode, tableConversionCheck]);

  const rowsToExport = useMemo(() => {
    const allRows =
      filteredTableRows.length > 0
        ? filteredTableRows
        : mergedTableData?.canConvert
          ? mergedTableData.rows
          : [];

    const sortedRows = [...allRows].sort((rowA, rowB) => {
      for (const sortRule of tableViewSorting) {
        const valueA = rowA[sortRule.id];
        const valueB = rowB[sortRule.id];

        if (valueA === valueB) continue;

        const stringA = valueA == null ? "" : String(valueA);
        const stringB = valueB == null ? "" : String(valueB);
        const comparisonResult = stringA.localeCompare(stringB, undefined, {
          numeric: true,
          sensitivity: "base",
        });

        if (comparisonResult !== 0) {
          return sortRule.desc ? -comparisonResult : comparisonResult;
        }
      }
      return 0;
    });

    const startIndex = (tablePagination.pageIndex - 1) * tablePagination.pageSize;
    const endIndex = startIndex + tablePagination.pageSize;

    return sortedRows.slice(startIndex, endIndex);
  }, [filteredTableRows, mergedTableData, tablePagination, tableViewSorting]);

  // const handleExportToCSV = useCallback(() => {
  //   if (!mergedTableData || !mergedTableData.canConvert || rowsToExport.length === 0) {
  //     return;
  //   }
  //   setIsExportModalOpen(true);
  // }, [mergedTableData, rowsToExport]);

  const handleExportConfirm = useCallback(() => {
    if (!mergedTableData || !mergedTableData.canConvert || rowsToExport.length === 0) {
      return;
    }
    const filename = `job-returns-${jid}-${Date.now()}.csv`;

    const sortedTableData = {
      ...mergedTableData,
      rows: rowsToExport,
    };
    exportToCSV(sortedTableData, filename);
    setIsExportModalOpen(false);
  }, [mergedTableData, jid, rowsToExport]);

  const handleTableErrorsChange = useCallback(
    (errors: Array<{ minion_id: string; error: string }>) => {
      setTableErrors(errors);
    },
    []
  );

  const handleTablePaginationChange = useCallback((pageIndex: number, pageSize: number) => {
    setTablePagination({ pageIndex, pageSize });
  }, []);

  const shouldRepeat = useCallback((event: KeyboardEvent) => {
    return event.altKey && event.code === "KeyR";
  }, []);

  const openRepeatConfigure = useCallback(() => {
    const job = jobStore.job;
    if (!job?.fun) {
      return;
    }
    setRepeatTargeting({
      target: jobStore.jobTargets ?? "*",
      targetType: job.tgt_type as CreateJobRequestTgtTypeEnum,
      defaultMaster: job.salt_master,
      ttlSeconds: job.ttl,
    });
    setRepeatConfigureFun(job.fun);
    setRepeatPickerOpen(true);
  }, [jobStore.job, jobStore.jobTargets]);

  const repeatKeydownHandler = useCallback(
    (event: KeyboardEvent) => {
      if (!shouldRepeat(event)) {
        return;
      }
      event.preventDefault();
      openRepeatConfigure();
    },
    [openRepeatConfigure, shouldRepeat]
  );

  useDocumentEvent("keydown", repeatKeydownHandler, true);

  let jobModalCreatePlugin: React.ReactNode = null;
  appStore.pluginsStore?.plugins?.["jobs.jobmodal.create"]?.forEach((plugin) => {
    jobModalCreatePlugin = (
      <>
        {jobModalCreatePlugin}
        <Parcel config={plugin.parcel} wrapWith="div" />
      </>
    );
  });

  useEffect(() => {
    if (isTableViewMode && jobStore.totalMinions > 0) {
      if (savedPageSizeRef.current === null) {
        savedPageSizeRef.current = jobStore.pagination.pageSize;
      }

      jobStore.handleLazyLoad({ pageIndex: 0, pageSize: jobStore.totalMinions }, tableViewSorting);
    }

    if (!isTableViewMode && savedPageSizeRef.current !== null) {
      const pageSize = savedPageSizeRef.current;
      savedPageSizeRef.current = null;

      jobStore.handleLazyLoad({ pageIndex: 0, pageSize }, tableViewSorting);
    }
  }, [isTableViewMode]);

  useEffect(() => {
    setFilteredTableRows([]);
    setTablePagination({ pageIndex: 1, pageSize: 50 });
    if (!isTableViewMode) {
      setTableErrors([]);
    }
  }, [mergedTableData, isTableViewMode]);

  useEffect(() => {
    if (jobStore.error) {
      navigate("/core/not-found");
    }
  }, [jobStore.error]);

  useEffect(() => {
    if (!jid) {
      return;
    }
    jobStore.reset();
    jobStore.mongoDBQuery = undefined;
    if (webSocketService.isConnected()) {
      webSocketService.disconnect();
    }
    setIsWebSocketConnecting(true);
    webSocketService.connect(
      `${apiCoreStore.env?.ws_server_url}/jobs/${jid}/info`,
      appStore.authStore?.user?.access_token,
      {
        onMessage: (messages: Array<WebSocketMessage<JobWebSocketMessage>>) => {
          jobStore.updateFromJobs(
            messages
              .filter((message) => message.message_tag === "job")
              .map((message) => message.payload as JobModel)
          );

          jobStore.mergeJobReturnsFromSocket(
            messages
              .filter((message) => message.message_tag === "job-return")
              .map((message) => message.payload as JobReturnModel)
          );
        },
        onOpen: () => {
          setIsWebSocketConnecting(false);
          jobStore.reload(jid);
        },
      }
    );
    return () => {
      setIsWebSocketConnecting(false);
      jobStore.reset();
      webSocketService.disconnect();
    };
  }, [jid]);

  useEffect(() => {
    if (webSocketService && appStore.authStore?.user?.access_token) {
      webSocketService.sendAccessToken(appStore.authStore.user.access_token);
    }
  }, [appStore.authStore?.user]);

  return (
    <>
      <PageHeader title={t("jobs.job-title", { jobId: jid })} />

      <Flex vertical gap={10} flex={1} style={{ minHeight: 0 }}>
        <Flex align="center" gap={24} wrap className={styles.jobDetailsContainer}>
          <div className={styles.jobDetailItem}>
            <Button
              shape="default"
              icon={<ReloadOutlined />}
              type="default"
              title={t("jobs.repeat-job")}
              onClick={openRepeatConfigure}
              disabled={!jobStore.job}
            />

            <JobModalShell
              key={jid}
              pickerOpen={repeatPickerOpen}
              onPickerOpenChange={setRepeatPickerOpen}
              configureFunction={repeatConfigureFun}
              onConfigureFunctionChange={setRepeatConfigureFun}
              targeting={repeatTargeting}
              onTargetingChange={setRepeatTargeting}
              repeatBaselineFun={jobStore.job?.fun ?? null}
              repeatBaselineArg={jobStore.job?.arg ?? undefined}
              repeatBaselineKwarg={jobStore.job?.kwarg ?? undefined}
            />

            <span className={styles.jobDetailLabel}>{t("jobs.table-master")}:</span>
            <span className={styles.jobDetailValue}>
              {jobStore.job?.salt_master ?? <Skeleton.Input size="small" />}
            </span>
          </div>

          <div className={styles.jobDetailItem}>
            <span className={styles.jobDetailLabel}>{t("jobs.table-target-type")}:</span>
            <span className={styles.jobDetailValue}>
              {jobStore.job?.tgt_type ?? <Skeleton.Input size="small" />}
            </span>
          </div>

          <div className={styles.jobDetailItem}>
            <span className={styles.jobDetailLabel}>{t("jobs.table-targets")}:</span>
            <span className={`${styles.jobDetailValue} ${styles.jobDetailValueTargets}`}>
              {jobStore.jobTargets ? (
                <>
                  <Text ellipsis className={styles.targetText} title={jobStore.jobTargets}>
                    {jobStore.jobTargets}
                  </Text>
                  <Flex>
                    <CopyToClipboardButton text={jobStore.jobTargets} />
                  </Flex>
                </>
              ) : (
                <Skeleton.Input size="small" />
              )}
            </span>
          </div>

          <div className={styles.jobDetailItem}>
            <span className={styles.jobDetailLabel}>{t("jobs.table-function")}:</span>
            <span className={styles.jobDetailValue}>
              {jobStore.job?.fun ?? <Skeleton.Input size="small" />}
            </span>
          </div>

          <div className={styles.jobDetailItem}>
            <span className={styles.jobDetailLabel}>{t("jobs.arguments")}:</span>
            <span className={styles.jobDetailValue}>
              {jobStore.isJobLoading ? (
                <Skeleton.Input size="small" />
              ) : (
                <JsonPreview
                  value={jobStore.job?.arg}
                  title={t("jobs.arguments")}
                  emptyLabel={t("jobs.no-arguments")}
                />
              )}
            </span>
          </div>

          <div className={styles.jobDetailItem}>
            <span className={styles.jobDetailLabel}>{t("jobs.key-value-arguments")}:</span>
            <span className={styles.jobDetailValue}>
              {jobStore.isJobLoading ? (
                <Skeleton.Input size="small" />
              ) : (
                <JsonPreview
                  value={jobStore.job?.kwarg}
                  title={t("jobs.key-value-arguments")}
                  emptyLabel={t("jobs.no-key-value-arguments")}
                  maxPreviewEntries={2}
                />
              )}
            </span>
          </div>

          <div className={styles.jobDetailItem}>
            <span className={styles.jobDetailLabel}>{t("jobs.table-user")}:</span>
            <span className={styles.jobDetailValue}>
              {jobStore.job?.user.name ?? <Skeleton.Input size="small" />}
            </span>
          </div>

          {jobStore.jobStartTimestamp && (
            <div className={`${styles.jobDetailItem} ${styles.jobDetailItemRight}`}>
              <span className={styles.jobDetailLabel}>{t("jobs.job-execution-duration")}:</span>
              <span className={styles.jobDetailValue}>
                <span title={t("jobs.job-execution-duration-actual-tooltip")}>
                  {!jobStore.isJobComplete ? (
                    <Timer
                      type="countup"
                      value={jobStore.jobStartTimestamp.getTime()}
                      format="HH:mm:ss"
                    />
                  ) : jobStore.actualJobDuration != null ? (
                    formatJobDuration(jobStore.actualJobDuration)
                  ) : (
                    "—"
                  )}
                </span>
                <span>/</span>
                <span title={t("jobs.job-execution-duration-max-tooltip")}>
                  {jobStore.job?.ttl == null
                    ? "—"
                    : jobStore.job.ttl === 0
                      ? t("jobs.ttl-unlimited")
                      : formatJobDuration(jobStore.job.ttl)}
                </span>
              </span>
            </div>
          )}
        </Flex>

        {showJobBodyLoader ? (
          <Flex className={styles.jobLoader} vertical align="center" justify="center" gap={20}>
            <Spin />

            {!!isCommandInitializing && <Text type="secondary">{t("jobs.executing-command")}</Text>}
          </Flex>
        ) : (
          <>
            <JobStatusProgress counts={statusCounts} />

            {showJobReturnsToolbar && (
              <Flex
                className={styles.switchContainer}
                justify="space-between"
                align="center"
                gap={16}
                wrap
              >
                <Flex className={styles.statsBadgesWrapper} gap={12} wrap>
                  <Tag color="green">
                    {t("task.job-returns-table.status-success")}: {statusCounts.success}
                  </Tag>
                  <Tag color="red">
                    {t("task.job-returns-table.status-failed")}: {statusCounts.failed}
                  </Tag>
                  <Tag color="orange">
                    {t("task.job-returns-table.status-timeout")}: {statusCounts.timeout}
                  </Tag>
                  <Tag color="default">
                    {t("task.job-returns-table.status-ignored")}: {statusCounts.ignored}
                  </Tag>
                  <Tag color="blue">
                    {t("task.job-returns-table.status-waiting")}: {statusCounts.waiting}
                  </Tag>
                </Flex>
                <Flex align="center" gap={16}>
                  {isTableViewMode && tableErrors.length > 0 && (
                    <Flex align="center" gap={8}>
                      <ExclamationCircleOutlined style={{ color: "#faad14", fontSize: "16px" }} />
                      <span>
                        {t("jobs.table-errors-found-short", { count: tableErrors.length })}
                      </span>
                      <ErrorsPopover errors={tableErrors} />
                    </Flex>
                  )}
                  <Flex align="center" gap={8}>
                    <Radio.Group
                      value={viewMode}
                      onChange={(e) => setViewMode(e.target.value)}
                      options={[
                        { label: t("jobs.standard-view"), value: "standard" },
                        { label: t("jobs.detailed-view"), value: "detailed" },
                        // {
                        //   label: t("jobs.table-view"),
                        //   value: "table",
                        //   disabled:
                        //     !tableConversionCheck?.canConvert ||
                        //     tableConversionCheck.rows.length === 0,
                        // },
                      ]}
                      optionType="button"
                      buttonStyle="solid"
                    />
                    {/*{(!tableConversionCheck?.canConvert ||*/}
                    {/*  tableConversionCheck.rows.length === 0) && (*/}
                    {/*  <Tooltip*/}
                    {/*    title={*/}
                    {/*      tableConversionCheck?.reason || t("jobs.table-conversion-not-possible")*/}
                    {/*    }*/}
                    {/*    placement="left"*/}
                    {/*    overlayInnerStyle={{ color: "#000", backgroundColor: "#fff" }}*/}
                    {/*  >*/}
                    {/*    <QuestionCircleOutlined className={styles.helpIcon} />*/}
                    {/*  </Tooltip>*/}
                    {/*)}*/}
                  </Flex>
                  {/*{isTableViewMode && (*/}
                  {/*  <Tooltip title={t("jobs.download-to-csv")}>*/}
                  {/*    <Button*/}
                  {/*      type="primary"*/}
                  {/*      icon={<UploadOutlined />}*/}
                  {/*      onClick={handleExportToCSV}*/}
                  {/*      disabled={*/}
                  {/*        !mergedTableData ||*/}
                  {/*        !mergedTableData.canConvert ||*/}
                  {/*        mergedTableData.rows.length === 0*/}
                  {/*      }*/}
                  {/*    />*/}
                  {/*  </Tooltip>*/}
                  {/*)}*/}
                </Flex>
              </Flex>
            )}

            <Flex vertical justify="center" className={styles.jobReturnTableWrapper}>
              <DefaultJobReturnTable
                jobReturns={effectiveJobReturns}
                jobStore={jobStore}
                isFullOutput={isFullOutput}
                isTableViewMode={isTableViewMode}
                jobStartTimestamp={jobStore.jobStartTimestamp}
                pagination={jobStore.pagination}
                sorting={jobStore.sorting}
                total={jobStore.total}
                onLazyLoad={jobStore.handleLazyLoad}
                isLoading={jobStore.isJobReturnsLoading}
                forceExpand={jobStore.isSingleJobReturn}
                onTableViewSortingChange={setTableViewSorting}
                onTableViewFilteredDataChange={setFilteredTableRows}
                onTableViewPaginationChange={handleTablePaginationChange}
                onTableViewErrorsChange={handleTableErrorsChange}
              />
            </Flex>

            {jobModalCreatePlugin}
          </>
        )}
      </Flex>

      <Modal
        title={t("jobs.export-to-csv-title")}
        open={isExportModalOpen}
        onOk={handleExportConfirm}
        onCancel={() => setIsExportModalOpen(false)}
        okText={t("common.export")}
        cancelText={t("common.cancel")}
      >
        <span>{t("jobs.export-to-csv-warning", { count: rowsToExport.length })}</span>
      </Modal>
    </>
  );
});

export default JobPage;
