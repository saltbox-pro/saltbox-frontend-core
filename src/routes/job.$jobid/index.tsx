import {
  ReloadOutlined,
  UploadOutlined,
  QuestionCircleOutlined,
  FilterOutlined,
  ArrowLeftOutlined,
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
import {
  Button,
  Flex,
  Progress,
  Radio,
  Skeleton,
  Statistic,
  Switch,
  Tooltip,
  Typography,
} from "antd";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router";
import Parcel from "single-spa-react/parcel";

import { JobModal } from "saltbox-core/shared/components/job-modal/job-modal";
import { DefaultJobReturnTable } from "saltbox-core/shared/components/job-return-table/default/default-job-return-table";
import {
  mergeJobReturnsToTable,
  exportToCSV,
} from "saltbox-core/shared/components/job-return-table/utils/table-converter";
import { formatExecutionTime } from "saltbox-core/shared/utils/execution-time-utils";
import { apiCoreStore, appStore, jobStore } from "saltbox-core/store";

import { ArgumentsPreview } from "./-components/arguments-preview";
import { KwargsPreview } from "./-components/kwargs-preview";
import { MinionsPopover } from "./-components/minions-popover";
import styles from "./index.module.css";

const { Text } = Typography;
const { Timer } = Statistic;

const JobPage = observer(() => {
  const { t } = useTranslation();
  const { jid } = useParams();
  const navigate = useNavigate();
  const [webSocketService] = useState(new WebSocketService<JobModel>());
  const [viewMode, setViewMode] = useState<"standard" | "detailed" | "table">("standard");
  const [tableViewSorting, setTableViewSorting] = useState<SortingState>([]);
  const [filteredTableRows, setFilteredTableRows] = useState<Record<string, unknown>[]>([]);

  const isFullOutput = viewMode === "detailed";
  const isTableViewMode = viewMode === "table";

  const formatJobDuration = (seconds: number): string => {
    return formatExecutionTime(seconds, t);
  };

  const tableConversionCheck = useMemo(() => {
    const jobReturnsData = jobStore.jobReturns.map((jobReturn) => ({
      data: jobReturn.data ?? null,
      minion_id: jobReturn.minion_id || "",
    }));

    return mergeJobReturnsToTable(jobReturnsData);
  }, [jobStore.jobReturns]);

  const mergedTableData = useMemo(() => {
    if (!isTableViewMode) {
      return null;
    }

    return tableConversionCheck;
  }, [isTableViewMode, tableConversionCheck]);

  useEffect(() => {
    setFilteredTableRows([]);
  }, [mergedTableData]);

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

  useEffect(() => {
    if (jobStore.error) {
      navigate("/not-found");
    }
  }, [jobStore.error]);

  useEffect(() => {
    if (!jid) {
      return;
    }
    jobStore.mongoDBQuery = undefined;
    if (webSocketService.isConnected) {
      webSocketService.disconnect();
    }
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
          jobStore.reload(jid);
        },
      }
    );
    return () => {
      jobStore.reset();
      webSocketService.disconnect();
    };
  }, [jid]);

  useEffect(() => {
    if (webSocketService && appStore.authStore?.user?.access_token) {
      webSocketService.sendAccessToken(appStore.authStore.user.access_token);
    }
  }, [appStore.authStore?.user]);

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

  return (
    <>
      <PageHeader title={t("jobs.job-title", { jobId: jid })} />

      <div className={styles.jobDetailsContainer}>
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
                <CopyToClipboardButton text={jobStore.jobTargets} />
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
            <span className={styles.jobDetailLabel}>{t("jobs.job-duration")}:</span>
            <span className={styles.jobDetailValue}>
              {jobStore.isJobComplete && jobStore.actualJobDuration ? (
                formatJobDuration(jobStore.actualJobDuration)
              ) : (
                <Timer
                  type="countup"
                  value={jobStore.jobStartTimestamp.getTime()}
                  format="HH:mm:ss"
                />
              )}
            </span>
          </div>
        )}
      </div>

      <div className={styles.progressContainer}>
        {jobStore.totalMinions > 0 && (
          <Progress
            percent={jobStore.progressPercent}
            success={{ percent: jobStore.successPercent }}
            strokeColor="#ff4d4f"
            size={{ height: 10 }}
            showInfo={false}
            className={styles.progressBar}
          />
        )}
      </div>

      {jobStore.totalMinions > 0 && (
        <Flex className={styles.switchContainer} justify="space-between" align="center" gap={16}>
          <div className={styles.statsWrapper}>
            <span className={styles.statsText}>
              <span className={styles.statsNumber}>{jobStore.successfulMinions}</span>{" "}
              {t("job.successful-minions")}
              {" / "}
              {jobStore.failedMinions > 0 ? (
                <MinionsPopover
                  minions={jobStore.failedMinionsList}
                  title={t("jobs.failed-minions")}
                />
              ) : (
                <span className={styles.statsNumber}>{jobStore.failedMinions}</span>
              )}{" "}
              {t("job.failed-minions")}
              {" / "}
              {jobStore.pendingMinions > 0 ? (
                <MinionsPopover
                  minions={jobStore.pendingMinionsList}
                  title={t("job.pending-minions")}
                />
              ) : (
                <span className={styles.statsNumber}>{jobStore.pendingMinions}</span>
              )}{" "}
              {t("job.pending-minions")}
            </span>
          </div>

          <Flex align="center" gap={16}>
            <Flex align="center" gap={8}>
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

      <div className={styles.jobReturnTableWrapper}>
        <DefaultJobReturnTable
          jobReturns={jobStore.jobReturns}
          isFullOutput={isFullOutput}
          isTableViewMode={isTableViewMode}
          jobStartTimestamp={jobStore.jobStartTimestamp}
          pagination={jobStore.pagination}
          sorting={jobStore.sorting}
          total={jobStore.total}
          onLazyLoad={jobStore.handleLazyLoad}
          isLoading={jobStore.isJobLoading || jobStore.isJobReturnsLoading}
          forceExpand={jobStore.isSingleJobReturn}
          onTableViewSortingChange={setTableViewSorting}
          onTableViewFilteredDataChange={setFilteredTableRows}
        />
      </div>

      {jobModalCreatePlugin}
    </>
  );
});

export default JobPage;
