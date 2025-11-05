import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router";
import { observer } from "mobx-react-lite";
import {
  Breadcrumb,
  Flex,
  Progress,
  Skeleton,
  Statistic,
  Switch,
  Typography,
} from "antd";
import { HomeOutlined, ReloadOutlined } from "@ant-design/icons";
import {
  CreateJobRequestTgtTypeEnum,
  JobModel,
} from "@saltbox/saltbox-core-api-client";
import { DefaultJobReturnTable } from "saltbox-core/shared/components/job-return-table/default/default-job-return-table";
import { JobModal } from "saltbox-core/shared/components/job-modal/job-modal";
import {
  CopyToClipboardButton,
  PageHeader,
  WebSocketService,
} from "@saltbox/saltbox-frontend-common";
import { formatExecutionTime } from "saltbox-core/shared/utils/execution-time-utils";
import { apiCoreStore, appStore, jobStore } from "saltbox-core/store";
import { JsonPopover } from "./-components/json-popover";
import { MinionsPopover } from "./-components/minions-popover";
import styles from "./index.module.css";
import Parcel from "single-spa-react/parcel";

const { Text } = Typography;
const { Timer } = Statistic;

const JobPage = observer(() => {
  const { t } = useTranslation();
  const { jid } = useParams();
  const navigate = useNavigate();
  const [webSocketService] = useState(new WebSocketService<JobModel>());
  const [isFullOutput, setIsFullOutput] = useState<boolean>(false);

  const formatJobDuration = (seconds: number): string => {
    return formatExecutionTime(seconds, t);
  };

  useEffect(() => {
    if (jid) {
      jobStore.reload(jid);
    }
    return () => {
      jobStore.reset();
    };
  }, [jid]);

  useEffect(() => {
    if (jobStore.error) {
      navigate("/not-found");
    }
  }, [jobStore.error]);

  useEffect(() => {
    if (!jid) {
      return;
    }
    if (webSocketService.isConnected) {
      webSocketService.disconnect();
    }
    webSocketService.connect(
      `${apiCoreStore.env?.ws_server_url}/jobs/${jid}/info`,
      appStore.authStore?.user?.access_token,
      (jobs: JobModel[]) => {
        jobStore.updateFromJobs(jobs);
      }
    );
    return () => webSocketService.disconnect();
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
            title: <Link to="/jobs">{t("jobs.title")}</Link>,
          },
          {
            title: t("jobs.job-title-breadcrumb"),
          },
        ]}
      />

      <PageHeader title={t("jobs.job-title", { jobId: jid })} />

      <div className={styles.jobDetailsContainer}>
        <div className={styles.jobDetailItem}>
          <JobModal
            target={(jobStore.job?.tgt as string)?.replace(/,\s+/g, ",")}
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
          <span className={styles.jobDetailLabel}>
            {t("jobs.table-target-type")}:
          </span>
          <span className={styles.jobDetailValue}>
            {jobStore.job?.tgt_type ?? <Skeleton.Input size="small" />}
          </span>
        </div>

        <div className={styles.jobDetailItem}>
          <span className={styles.jobDetailLabel}>
            {t("jobs.table-targets")}:
          </span>
          <span className={styles.jobDetailValue}>
            {(jobStore.job?.tgt as string) ? (
              <>
                <Text
                  ellipsis
                  style={{ maxWidth: "200px" }}
                  title={jobStore.job?.tgt as string}
                >
                  {jobStore.job?.tgt as string}
                </Text>
                <CopyToClipboardButton
                  text={
                    (jobStore.job?.tgt as string)?.replace(/,\s+/g, ",") || ""
                  }
                />
              </>
            ) : (
              <Skeleton.Input size="small" />
            )}
          </span>
        </div>

        <div className={styles.jobDetailItem}>
          <span className={styles.jobDetailLabel}>
            {t("jobs.table-function")}:
          </span>
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
              <Flex align="center" gap={4}>
                <span>
                  {jobStore.job.arg.length} {t("jobs.arguments")}
                </span>
                <JsonPopover
                  data={jobStore.job.arg}
                  title={t("jobs.arguments")}
                />
              </Flex>
            ) : (
              <Text type="secondary">{t("jobs.no-arguments")}</Text>
            )}
          </span>
        </div>

        <div className={styles.jobDetailItem}>
          <span className={styles.jobDetailLabel}>
            {t("jobs.key-value-arguments")}:
          </span>
          <span className={styles.jobDetailValue}>
            {jobStore.isJobLoading ? (
              <Skeleton.Input size="small" />
            ) : jobStore.job?.kwarg &&
              Object.keys(jobStore.job.kwarg).length > 0 ? (
              <Flex align="center" gap={4}>
                <span>
                  {t("jobs.arguments")}:{" "}
                  {Object.keys(jobStore.job.kwarg).length}
                </span>
                <JsonPopover
                  data={jobStore.job.kwarg}
                  title={t("jobs.key-value-arguments")}
                />
              </Flex>
            ) : (
              <Text type="secondary">{t("jobs.no-key-value-arguments")}</Text>
            )}
          </span>
        </div>
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
        <Flex
          className={styles.switchContainer}
          justify="space-between"
          align="center"
          gap={16}
        >
          <div className={styles.statsWrapper}>
            <span className={styles.statsText}>
              <span className={styles.statsNumber}>
                {jobStore.successfulMinions}
              </span>{" "}
              {t("job.successful-minions")}
              {" / "}
              {jobStore.failedMinions > 0 ? (
                <MinionsPopover
                  minions={jobStore.failedMinionsList}
                  title={t("jobs.failed-minions")}
                />
              ) : (
                <span className={styles.statsNumber}>
                  {jobStore.failedMinions}
                </span>
              )}{" "}
              {t("job.failed-minions")}
              {" / "}
              {jobStore.pendingMinions > 0 ? (
                <MinionsPopover
                  minions={jobStore.pendingMinionsList}
                  title={t("job.pending-minions")}
                />
              ) : (
                <span className={styles.statsNumber}>
                  {jobStore.pendingMinions}
                </span>
              )}{" "}
              {t("job.pending-minions")}
            </span>
          </div>

          <Flex align="center" gap={16}>
            {jobStore.jobStartTime && (
              <div className={styles.timerWrapper}>
                <span className={styles.timerLabel}>
                  {t("jobs.job-duration")}:
                </span>
                {jobStore.isJobComplete && jobStore.actualJobDuration ? (
                  <b>{formatJobDuration(jobStore.actualJobDuration)}</b>
                ) : (
                  <Timer
                    type="countup"
                    value={jobStore.jobStartTime}
                    format="HH:mm:ss"
                  />
                )}
              </div>
            )}
            <Flex className={styles.switchWrapper}>
              <span>{t("jobs.full-output")}</span>
              <Switch checked={isFullOutput} onChange={setIsFullOutput} />
            </Flex>
          </Flex>
        </Flex>
      )}

      <div className={styles.jobReturnTableWrapper}>
        <DefaultJobReturnTable
          jobReturns={jobStore.jobReturns}
          isFullOutput={isFullOutput}
          jobStartTimestamp={jobStore.jobStartTimestamp}
          pagination={jobStore.pagination}
          sorting={jobStore.sorting}
          total={jobStore.total}
          onLazyLoad={jobStore.handleLazyLoad}
          isLoading={jobStore.isJobLoading || jobStore.isJobReturnsLoading}
          forceExpand={jobStore.isSingleJobReturn}
        />
      </div>

      {jobModalCreatePlugin}
    </>
  );
});

export default JobPage;
