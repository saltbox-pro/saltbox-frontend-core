import {
  ReloadOutlined,
  UploadOutlined,
  QuestionCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { CreateJobRequestTgtTypeEnum, JobModel } from "@saltbox/saltbox-core-api-client";
import {
  CopyToClipboardButton,
  PageHeader,
  WebSocketMessage,
  WebSocketService,
} from "@saltbox/saltbox-frontend-common";
import {
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { Button, Flex, Radio, Skeleton, Statistic, Switch, Tag, Tooltip, Typography } from "antd";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import Parcel from "single-spa-react/parcel";

import { JobStatusProgress } from "saltbox-core/routes/jobs.$jid/-components/job-status-progress";
import { JobModal } from "saltbox-core/shared/components/job-modal/job-modal";
import { DefaultJobReturnTable } from "saltbox-core/shared/components/job-return-table/default/default-job-return-table";
import {
  mergeJobReturnsToTable,
  exportToCSV,
} from "saltbox-core/shared/components/job-return-table/utils/table-converter";
import { formatExecutionTime } from "saltbox-core/shared/utils/execution-time-utils";
import { apiCoreStore, appStore, jobStore } from "saltbox-core/store";

import { ArgumentsPreview } from "./-components/arguments-preview";
import { ErrorsPopover } from "./-components/errors-popover";
import { KwargsPreview } from "./-components/kwargs-preview";
import styles from "./index.module.css";

const { Text } = Typography;
const { Timer } = Statistic;

const JobPage = observer(() => {
  const { t } = useTranslation();
  const { jid } = useParams();
  const navigate = useNavigate();

  const [webSocketService] = useState(new WebSocketService<JobModel>());
  const [isWebSocketConnecting, setIsWebSocketConnecting] = useState(false);
  const [isRevealedAll, setIsRevealedAll] = useState(() => {
    return Boolean(localStorage.getItem(`job-revealed-all-returns:${jid}`) === "true");
  });
  const [viewMode, setViewMode] = useState<"standard" | "detailed" | "table">("standard");
  const [tableViewSorting, setTableViewSorting] = useState<SortingState>([]);
  const [filteredTableRows, setFilteredTableRows] = useState<Record<string, unknown>[]>([]);
  const [tableErrors, setTableErrors] = useState<Array<{ minion_id: string; error: string }>>([]);

  const isFullOutput = viewMode === "detailed";
  const isTableViewMode = viewMode === "table";

  const effectiveJobReturns = useMemo(
    () => (jid && jobStore.jid === jid ? jobStore.jobReturns : []),
    [jid, jobStore.jid, jobStore.jobReturns]
  );

  const statusCounts = jobStore.jobReturnStatusCounts;
  const formatJobDuration = (seconds: number): string => {
    return formatExecutionTime(seconds, t);
  };

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

  const tableColumnsForExport = useMemo(() => {
    if (!mergedTableData || !mergedTableData.canConvert) {
      return [];
    }
    const columnHelper = createColumnHelper<Record<string, unknown>>();
    return mergedTableData.columns
      .filter((col) => col !== "key")
      .map((colName) =>
        columnHelper.accessor(colName as keyof Record<string, unknown>, {
          header: colName,
        })
      );
  }, [mergedTableData]);

  const rowsToExport = useMemo(() => {
    if (filteredTableRows.length > 0) {
      return filteredTableRows;
    }
    return mergedTableData?.canConvert ? mergedTableData.rows : [];
  }, [filteredTableRows, mergedTableData]);

  const exportTable = useReactTable({
    data: rowsToExport,
    columns: tableColumnsForExport,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting: tableViewSorting,
    },
    enableSorting: true,
  });

  const handleExportToCSV = useCallback(() => {
    if (!mergedTableData || !mergedTableData.canConvert || rowsToExport.length === 0) {
      return;
    }
    const filename = `job-returns-${jid}-${Date.now()}.csv`;

    const sortedRows = exportTable.getRowModel().rows.map((row) => row.original);
    const sortedTableData = {
      ...mergedTableData,
      rows: sortedRows,
    };
    exportToCSV(sortedTableData, filename);
  }, [mergedTableData, jid, exportTable, rowsToExport]);

  const handleTableErrorsChange = useCallback(
    (errors: Array<{ minion_id: string; error: string }>) => {
      setTableErrors(errors);
    },
    []
  );

  const handleToggleRevealedAll = (value: boolean) => {
    setIsRevealedAll(value);
    localStorage.setItem(`job-revealed-all-returns:${jid}`, value.toString());
  };

  const shouldRepeat = useCallback((event: KeyboardEvent) => {
    return event.altKey && event.code === "KeyR";
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

  useEffect(() => {
    setIsRevealedAll(Boolean(localStorage.getItem(`job-revealed-all-returns:${jid}`) === "true"));
  }, [jid]);

  useEffect(() => {
    setFilteredTableRows([]);
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
        onMessage: (messages: Array<WebSocketMessage<JobModel>>) => {
          jobStore.updateFromJobs(
            messages
              .filter((message) => message.message_tag === "job")
              .map((message) => message.payload)
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
            <JobModal
              target={jobStore.jobTargets}
              targetType={jobStore.job?.tgt_type as CreateJobRequestTgtTypeEnum}
              fun={jobStore.job?.fun}
              arg={jobStore.job?.arg}
              kwarg={jobStore.job?.kwarg}
              shouldShowModalByKeyboardEvent={shouldRepeat}
              buttonProps={{
                shape: "default",
                icon: <ReloadOutlined />,
                type: "default",
                showText: false,
                title: t("jobs.repeat-job"),
              }}
            />
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
              ) : jobStore.job?.arg && jobStore.job.arg.length > 0 ? (
                <ArgumentsPreview args={jobStore.job.arg} title={t("jobs.arguments")} />
              ) : (
                <Text type="secondary">{t("jobs.no-arguments")}</Text>
              )}
            </span>
          </div>

          <div className={styles.jobDetailItem}>
            <span className={styles.jobDetailLabel}>{t("jobs.key-value-arguments")}:</span>
            <span className={styles.jobDetailValue}>
              {jobStore.isJobLoading ? (
                <Skeleton.Input size="small" />
              ) : jobStore.job?.kwarg && Object.keys(jobStore.job.kwarg).length > 0 ? (
                <KwargsPreview kwargs={jobStore.job.kwarg} title={t("jobs.key-value-arguments")} />
              ) : (
                <Text type="secondary">{t("jobs.no-key-value-arguments")}</Text>
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

        <JobStatusProgress counts={statusCounts} />

        {jobStore.totalMinions > 0 && (
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
                  <span>{t("jobs.table-errors-found-short", { count: tableErrors.length })}</span>
                  <ErrorsPopover errors={tableErrors} />
                </Flex>
              )}
              <Flex align="center" gap={8}>
                {(viewMode === "standard" || viewMode === "detailed") &&
                  jobStore.totalMinions > 1 && (
                    <Flex align="center" gap={4}>
                      {t("jobs.reveal-all-returns")}
                      <Switch checked={isRevealedAll} onChange={handleToggleRevealedAll} />
                    </Flex>
                  )}
                <Radio.Group
                  value={viewMode}
                  onChange={(e) => setViewMode(e.target.value)}
                  options={[
                    { label: t("jobs.standard-view"), value: "standard" },
                    { label: t("jobs.detailed-view"), value: "detailed" },
                    {
                      label: t("jobs.table-view"),
                      value: "table",
                      disabled:
                        !tableConversionCheck?.canConvert || tableConversionCheck.rows.length === 0,
                    },
                  ]}
                  optionType="button"
                  buttonStyle="solid"
                />
                {(!tableConversionCheck?.canConvert || tableConversionCheck.rows.length === 0) && (
                  <Tooltip
                    title={tableConversionCheck?.reason || t("jobs.table-conversion-not-possible")}
                    placement="left"
                    overlayInnerStyle={{ color: "#000", backgroundColor: "#fff" }}
                  >
                    <QuestionCircleOutlined className={styles.helpIcon} />
                  </Tooltip>
                )}
              </Flex>
              {isTableViewMode && (
                <Tooltip title={t("jobs.download-to-csv")}>
                  <Button
                    type="primary"
                    icon={<UploadOutlined />}
                    onClick={handleExportToCSV}
                    disabled={
                      !mergedTableData ||
                      !mergedTableData.canConvert ||
                      mergedTableData.rows.length === 0
                    }
                  />
                </Tooltip>
              )}
            </Flex>
          </Flex>
        )}

        <Flex vertical justify="center" className={styles.jobReturnTableWrapper}>
          <DefaultJobReturnTable
            jobReturns={effectiveJobReturns}
            isFullOutput={isFullOutput}
            isTableViewMode={isTableViewMode}
            jobStartTimestamp={jobStore.jobStartTimestamp}
            pagination={jobStore.pagination}
            sorting={jobStore.sorting}
            total={jobStore.total}
            onLazyLoad={jobStore.handleLazyLoad}
            isLoading={
              isWebSocketConnecting || jobStore.isJobLoading || jobStore.isJobReturnsLoading
            }
            forceExpand={jobStore.isSingleJobReturn || isRevealedAll}
            onTableViewSortingChange={setTableViewSorting}
            onTableViewFilteredDataChange={setFilteredTableRows}
            onTableViewErrorsChange={handleTableErrorsChange}
          />
        </Flex>

        {jobModalCreatePlugin}
      </Flex>
    </>
  );
});

export default JobPage;
