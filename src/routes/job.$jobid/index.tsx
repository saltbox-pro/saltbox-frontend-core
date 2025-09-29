import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router";
import { toJS } from "mobx";
import { observer } from "mobx-react-lite";
import {
  Breadcrumb,
  Flex,
  Progress,
  Skeleton,
  Spin,
  Statistic,
  Switch,
  Typography,
} from "antd";
import { HomeOutlined, ReloadOutlined } from "@ant-design/icons";
import { JobResult, CreateJobRequestTgtTypeEnum } from "@saltbox/saltbox-core-api-client";
import { CopyToClipboardButton } from "saltbox-core/shared/components/copy-to-clipboard-button/copy-to-clipboard-button";
import { DefaultJobReturnTable } from "saltbox-core/shared/components/job-return-table/default/default-job-return-table";
import { JobModal } from "saltbox-core/shared/components/job-modal/job-modal";
import { MatIcon } from "saltbox-core/shared/components/mat-icon/mat-icon";
import { formatExecutionTime, TimeUnits } from "saltbox-core/shared/utils/execution-time-utils";
import { PageHeader } from "@saltbox/saltbox-frontend-common";
import { apiCoreStore, appStore, jobStore } from "saltbox-core/store";
import { JsonPopover } from "./-components/json-popover";
import { MinionsPopover } from "./-components/minions-popover";
import styles from "./index.module.css";

const { Text } = Typography;
const { Timer } = Statistic;

const JobPage = observer(() => {
  const { t } = useTranslation();
  const { jid } = useParams();
  const navigate = useNavigate();
  const [socket, setSocket] = useState<WebSocket | undefined>();
  const [isSocketOpen, setIsSocketOpen] = useState<boolean>(false);
  const [isFullOutput, setIsFullOutput] = useState<boolean>(false);
  const [maxExecutionTime, setMaxExecutionTime] = useState<number | null>(null);

  const jobStartTime = jobStore.job?.fms_jid_timestamp
    ? new Date(jobStore.job.fms_jid_timestamp).getTime()
    : null;

  const minionsArray = jobStore.job?.minions || [];
  const totalMinions = Math.max(0, minionsArray.length > 0 ? minionsArray.length : (jobStore.jobReturnsCount || jobStore.jobReturns.length));

  const successfulMinionsList = jobStore.jobReturns.filter(return_ => return_.success);
  const failedMinionsList = jobStore.jobReturns.filter(return_ => !return_.success);

  const respondedMinions = jobStore.jobReturns.map(return_ => return_.id);

  const allMinions = minionsArray.length > 0 ? minionsArray : [];
  const pendingMinionsList = allMinions.filter(minion => !respondedMinions.includes(minion));

  const successfulMinions = Math.max(0, successfulMinionsList.length);
  const failedMinions = Math.max(0, failedMinionsList.length);
  const pendingMinions = Math.max(0, pendingMinionsList.length);

  const progressPercent = totalMinions > 0 ? (jobStore.jobReturns.length / totalMinions) * 100 : 0;
  const successPercent = totalMinions > 0 ? (successfulMinions / totalMinions) * 100 : 0;
  const isJobComplete = totalMinions > 0 && pendingMinions === 0;
  const jobDurationSeconds = isJobComplete && maxExecutionTime && maxExecutionTime > 0 ? maxExecutionTime : null;

  const formatJobDuration = (seconds: number): string => {
    const timeUnits: TimeUnits = {
      milliseconds: t("task.job-returns-table.time-units.milliseconds"),
      seconds: t("task.job-returns-table.time-units.seconds"),
      minutes: t("task.job-returns-table.time-units.minutes"),
      hours: t("task.job-returns-table.time-units.hours"),
    };
    return formatExecutionTime(seconds, timeUnits);
  };

  useEffect(() => {
    jobStore.reload(jid);
  }, [jid]);

  useEffect(() => {
    if (jobStore.error) {
      navigate("/not-found");
    }
  }, [jobStore.error]);

  useEffect(() => {
    if (socket) {
      socket.close();
      setIsSocketOpen(false);
    }

    jobStore.jobReturns = [];
    jobStore.jobReturnsCount = 0;

    const webSocket = new WebSocket(
      `${apiCoreStore.env?.ws_server_url}/jobs/${jid}/return`,
    );
    setSocket(webSocket);

    webSocket.addEventListener("message", (event: MessageEvent<string>) => {
      const parsedJobReturn = JSON.parse(event.data) as JobResult;
      if (!jobStore.isJobReturnsLoading) {
        jobStore.addJobReturn(parsedJobReturn);
      }
    });

    webSocket.addEventListener("open", () => {
      setIsSocketOpen(true);
    });

    webSocket.addEventListener("close", () => {
      setIsSocketOpen(false);
    });

    webSocket.addEventListener("error", (error) => {
      setIsSocketOpen(false);
    });

    return () => {
      webSocket.close();
      setIsSocketOpen(false);
    };
  }, [jid]);

  useEffect(() => {
    const accessToken = appStore.authStore?.user?.access_token;
    if (accessToken && socket && isSocketOpen) {
      socket.send(accessToken);
    }
  }, [appStore.authStore?.user, socket, isSocketOpen]);

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
                <CopyToClipboardButton text={(jobStore.job?.tgt as string)?.replace(/,\s+/g, ",") || ""} />
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
          <span className={styles.jobDetailLabel}>{t("jobs.key-value-arguments")}:</span>
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

      {totalMinions > 0 && (
        <div className={styles.progressContainer}>
          <Progress
            percent={progressPercent}
            success={{ percent: successPercent }}
            strokeColor="#ff4d4f"
            size={{ height: 10 }}
            showInfo={false}
            className={styles.progressBar}
          />
        </div>
      )}

      <Flex className={styles.switchContainer} justify="space-between" align="center" gap={16}>
        {totalMinions > 0 && (
          <div className={styles.statsWrapper}>
            <span className={styles.statsText}>
              <span className={styles.statsNumber}>{successfulMinions}</span> successful /
              {failedMinions > 0 ? (
                <MinionsPopover
                  minions={failedMinionsList}
                  title={t("jobs.failed-minions")}
                />
              ) : (
                <span className={styles.statsNumber}>{failedMinions}</span>
              )} failed /
              {pendingMinions > 0 ? (
                <MinionsPopover
                  minions={pendingMinionsList}
                  title={t("jobs.pending-minions")}
                />
              ) : (
                <span className={styles.statsNumber}>{pendingMinions}</span>
              )} pending
            </span>
          </div>
        )}

        {totalMinions > 0 && (
          <Flex align="center" gap={16}>
            {jobStartTime && (
              <div className={styles.timerWrapper}>
                <span className={styles.timerLabel}>{t("jobs.job-duration")}:</span>
                {isJobComplete && jobDurationSeconds ? (
                  <b>
                    {formatJobDuration(jobDurationSeconds)}
                  </b>
                ) : (
                  <Timer
                    type="countup"
                    value={jobStartTime}
                    format="HH:mm:ss"
                  />
                )}
              </div>
            )}
            <Flex className={styles.switchWrapper}>
              <span>{t("jobs.full-output")}</span>
              <Switch
                checked={isFullOutput}
                onChange={setIsFullOutput}
              />
            </Flex>
          </Flex>
        )}
      </Flex>

      {jobStore.isJobReturnsLoading ? (
        <div className={`${styles.jobReturnTableWrapper} ${styles.spinnerContainer}`}>
          <Spin size="large" />
        </div>
      ) : (
        <div className={styles.jobReturnTableWrapper}>
          <DefaultJobReturnTable
            jobReturns={toJS(jobStore.jobReturns)}
            isFullOutput={isFullOutput}
            jobStartTimestamp={jobStore.job?._stamp || null}
            onExecutionTimesCalculated={(times) => setMaxExecutionTime(times[0] || null)}
          />
        </div>
      )}
    </>
  );
});

export default JobPage;
