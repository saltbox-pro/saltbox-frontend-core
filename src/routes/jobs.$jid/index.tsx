import { DownloadOutlined, ReloadOutlined, QuestionCircleOutlined } from "@ant-design/icons";
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
  AcceptedMastersActionButton,
  RefreshButton,
  getApiErrorMessage,
  isGlobalServerError,
  useWithAcceptedMastersCheck,
} from "@saltbox/saltbox-frontend-common";
import {
  Button,
  Flex,
  Modal,
  Radio,
  Skeleton,
  Spin,
  Statistic,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import Parcel from "single-spa-react/parcel";

import { JobLaunchError } from "saltbox-core/routes/jobs.$jid/-components/job-launch-error";
import { JobStatusProgress } from "saltbox-core/routes/jobs.$jid/-components/job-status-progress";
import {
  JobModalShell,
  type JobModalTargeting,
  type JobReplayBaseline,
} from "saltbox-core/shared/components/job-modal/job-modal-shell";
import { DefaultJobReturnTable } from "saltbox-core/shared/components/job-return-table";
import { downloadJobReturnsTableCsv } from "saltbox-core/shared/components/job-return-table/service/download-job-returns-table-csv.service";
import { JsonPreview } from "saltbox-core/shared/components/json-preview";
import { useDocumentEvent } from "saltbox-core/shared/hooks/useDocumentEvent";
import { formatExecutionTime } from "saltbox-core/shared/utils/execution-time-utils";
import { apiCoreStore, appStore, jobStore, mastersStore } from "saltbox-core/store";

import styles from "./index.module.css";

const { Text } = Typography;
const { Timer } = Statistic;

type JobViewMode = "standard" | "detailed" | "table" | "state-apply";

type JobWebSocketMessage = JobModel | JobReturnModel;

const JobPage = observer(() => {
  const { t } = useTranslation();
  const { jid } = useParams();
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const withAcceptedMastersCheck = useWithAcceptedMastersCheck(messageApi);

  const [webSocketService] = useState(new WebSocketService<JobWebSocketMessage>());
  const [isWebSocketConnecting, setIsWebSocketConnecting] = useState(false);
  const [viewMode, setViewMode] = useState<JobViewMode>("standard");
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isTableExportLoading, setIsTableExportLoading] = useState(false);
  const [isManualRefreshLoading, setIsManualRefreshLoading] = useState(false);

  const isFullOutput = viewMode === "detailed";
  const isTableViewMode = viewMode === "table";
  const isStepsViewMode = viewMode === "state-apply";
  const isStateApplyJob = jobStore.job?.fun === "state.apply";

  const [repeatPickerOpen, setRepeatPickerOpen] = useState(false);
  const [repeatConfigureFun, setRepeatConfigureFun] = useState<string | null>(null);
  const [repeatBaseline, setRepeatBaseline] = useState<JobReplayBaseline | null>(null);
  const [repeatTargeting, setRepeatTargeting] = useState<JobModalTargeting>({
    target: "*",
    targetType: CreateJobRequestTgtTypeEnum.Glob,
    defaultMaster: "",
  });

  useEffect(() => {
    setRepeatConfigureFun(null);
    setRepeatPickerOpen(false);
    setRepeatBaseline(null);
    setIsExportModalOpen(false);
  }, [jid]);

  const effectiveJobReturns = jid && jobStore.jid === jid ? jobStore.jobReturns : [];
  const statusCounts = jobStore.jobReturnStatusCounts;
  const isTableViewAvailable = statusCounts.success > 0;
  const showExportButton = isTableViewAvailable;

  const formatJobDuration = (seconds: number): string => {
    return formatExecutionTime(seconds, t);
  };
  const isCommandInitializing = jobStore.job != null && jobStore.job.status === JobStatus.Starting;
  const showJobBodyLoader = isWebSocketConnecting || jobStore.isJobLoading || isCommandInitializing;
  const isLaunchError = jobStore.isLaunchError;
  const showJobReturnsToolbar =
    !isLaunchError &&
    (jobStore.totalMinions > 0 || jobStore.total > 0 || effectiveJobReturns.length > 0);

  const shouldRepeat = useCallback((event: KeyboardEvent) => {
    return event.altKey && event.code === "KeyR";
  }, []);

  const openRepeatConfigure = useCallback(() => {
    const job = jobStore.job;
    if (!job?.fun) {
      return;
    }

    setRepeatBaseline({
      fun: job.fun,
      arg: job.arg ?? undefined,
      kwarg: job.kwarg ?? undefined,
    });
    setRepeatTargeting({
      target: jobStore.jobTargets ?? "*",
      targetType: job.tgt_type as CreateJobRequestTgtTypeEnum,
      defaultMaster: job.salt_master,
      ttlSeconds: job.ttl,
    });
    setRepeatConfigureFun(job.fun);
    setRepeatPickerOpen(true);
  }, [jobStore.job, jobStore.jobTargets]);

  const handleRepeatConfigureClose = useCallback(() => {
    setRepeatBaseline(null);
  }, []);

  const repeatKeydownHandler = useCallback(
    (event: KeyboardEvent) => {
      if (!shouldRepeat(event)) {
        return;
      }
      event.preventDefault();
      withAcceptedMastersCheck({
        warningActionText: t("job-modal.warning-action.repeat-job"),
        onSuccess: openRepeatConfigure,
        navigate,
        checkHasAcceptedMasters: () => mastersStore.hasAcceptedMasters(),
      });
    },
    [navigate, openRepeatConfigure, shouldRepeat, t, withAcceptedMastersCheck]
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

  const handleViewModeChange = useCallback((nextMode: JobViewMode) => {
    if (nextMode === "table") {
      jobStore.prepareTableViewLoad();
      setViewMode(nextMode);
      jobStore.loadJobReturnsTable();
      return;
    }

    jobStore.beginJobReturnsReload();
    setViewMode(nextMode);
    jobStore.loadJobReturns();
  }, []);

  const handleJobReturnsRefresh = useCallback(async () => {
    setIsManualRefreshLoading(true);
    try {
      if (isTableViewMode) {
        await jobStore.loadJobReturnsTable();
        return;
      }

      await jobStore.loadJobReturns();
    } finally {
      setIsManualRefreshLoading(false);
    }
  }, [isTableViewMode]);

  const handleExportToCsv = useCallback(async () => {
    if (!jid) {
      return;
    }

    setIsTableExportLoading(true);

    try {
      await downloadJobReturnsTableCsv(
        {
          ...jobStore.mongoDBQuery,
          jid,
        },
        `job-returns-${jid}-${Date.now()}.csv`
      );
      setIsExportModalOpen(false);
    } catch (error) {
      console.error("Error exporting job returns table:", error);
      if (isGlobalServerError(error)) {
        return;
      }
      message.error(await getApiErrorMessage(error, t("jobs.table-view-export-error")));
    } finally {
      setIsTableExportLoading(false);
    }
  }, [jid, t]);

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
    setViewMode("standard");
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
      {contextHolder}
      <PageHeader title={t("jobs.job-title", { jobId: jid })} />

      <Flex vertical gap={10} flex={1} style={{ minHeight: 0 }}>
        <Flex align="center" gap={24} wrap className={styles.jobDetailsContainer}>
          <div className={styles.jobDetailItem}>
            <AcceptedMastersActionButton
              shape="default"
              icon={<ReloadOutlined />}
              type="default"
              title={t("jobs.repeat-job")}
              messageApi={messageApi}
              navigate={navigate}
              checkHasAcceptedMasters={() => mastersStore.hasAcceptedMasters()}
              warningActionText={t("job-modal.warning-action.repeat-job")}
              onAction={openRepeatConfigure}
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
              repeatBaseline={repeatBaseline}
              onAfterConfigureClose={handleRepeatConfigureClose}
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
              {jobStore.job?.user?.name ?? <Skeleton.Input size="small" />}
            </span>
          </div>

          {jobStore.jobStartTimestamp && (
            <div className={`${styles.jobDetailItem} ${styles.jobDetailItemRight}`}>
              <span className={styles.jobDetailLabel}>{t("jobs.job-execution-duration")}:</span>
              <span className={styles.jobDetailValue}>
                <span title={t("jobs.job-execution-duration-actual-tooltip")}>
                  {isLaunchError ? (
                    "—"
                  ) : !jobStore.isJobComplete ? (
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
                    ? "-"
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
                <Flex align="center" gap={8}>
                  <RefreshButton
                    title={t("common.refresh")}
                    loading={isManualRefreshLoading}
                    onClick={handleJobReturnsRefresh}
                  />
                  {showExportButton && (
                    <Tooltip title={t("jobs.download-to-csv")}>
                      <Button
                        type="primary"
                        icon={<DownloadOutlined />}
                        loading={isTableExportLoading}
                        onClick={() => setIsExportModalOpen(true)}
                      />
                    </Tooltip>
                  )}
                  <Radio.Group
                    value={viewMode}
                    onChange={(event) => handleViewModeChange(event.target.value)}
                    options={[
                      { label: t("jobs.standard-view"), value: "standard" },
                      { label: t("jobs.detailed-view"), value: "detailed" },
                      ...(isStateApplyJob
                        ? [{ label: t("jobs.state-apply-view"), value: "state-apply" }]
                        : []),
                      {
                        label: t("jobs.table-view"),
                        value: "table",
                        disabled: !isTableViewAvailable,
                      },
                    ]}
                    optionType="button"
                    buttonStyle="solid"
                  />
                  {!isTableViewAvailable && (
                    <Tooltip
                      title={t("jobs.table-conversion-not-possible")}
                      placement="left"
                      overlayInnerStyle={{ color: "#000", backgroundColor: "#fff" }}
                    >
                      <QuestionCircleOutlined className={styles.helpIcon} />
                    </Tooltip>
                  )}
                </Flex>
              </Flex>
            )}

            <Flex vertical justify="center" className={styles.jobReturnTableWrapper}>
              {isLaunchError ? (
                <JobLaunchError
                  launchErrorType={jobStore.job?.launch_error_type}
                  target={jobStore.jobTargetsText}
                />
              ) : (
                <DefaultJobReturnTable
                  jobReturns={effectiveJobReturns}
                  jobStore={jobStore}
                  isFullOutput={isFullOutput}
                  isStepsView={isStepsViewMode}
                  isTableViewMode={isTableViewMode}
                  jobStartTimestamp={jobStore.jobStartTimestamp}
                  pagination={isTableViewMode ? jobStore.tablePagination : jobStore.pagination}
                  sorting={jobStore.sorting}
                  total={isTableViewMode ? jobStore.jobReturnTableTotal : jobStore.total}
                  onLazyLoad={jobStore.handleLazyLoad}
                  isLoading={jobStore.isJobReturnsLoading}
                  forceExpand={jobStore.isSingleJobReturn}
                  tableColumns={jobStore.jobReturnTableColumns}
                  tableRows={jobStore.jobReturnTableRows}
                  isTableLoading={jobStore.isJobReturnTableLoading}
                  tableLoadError={jobStore.jobReturnTableLoadError}
                  onTableLazyLoad={jobStore.handleTableLazyLoad}
                />
              )}
            </Flex>

            {jobModalCreatePlugin}
          </>
        )}
      </Flex>

      <Modal
        title={t("jobs.export-to-csv-title")}
        open={isExportModalOpen}
        onOk={handleExportToCsv}
        onCancel={() => setIsExportModalOpen(false)}
        okText={t("common.export")}
        cancelText={t("common.cancel")}
        confirmLoading={isTableExportLoading}
      >
        <span>{t("jobs.export-to-csv-warning")}</span>
      </Modal>
    </>
  );
});

export default JobPage;
