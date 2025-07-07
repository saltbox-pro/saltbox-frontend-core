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
  Descriptions,
  Flex,
  Skeleton,
  Typography,
  message,
} from "antd";
import { HomeOutlined } from "@ant-design/icons";
import { JobResult } from "saltbox-core-api";
import { CopyToClipboardButton } from "saltbox-core/shared/components/copy-to-clipboard-button/copy-to-clipboard-button";
import { DefaultJobReturnTable } from "saltbox-core/shared/components/job-return-table/default/default-job-return-table";
import { PageHeader } from "saltbox-core/shared/components/page-header/page-header";
/* import { authStore } from "saltbox-core/store"; */
import { envStore } from "saltbox-core/store";
import { jobStore } from "saltbox-core/store";
import { JsonPopover } from "./-components/json-popover";
import styles from "./index.module.css";

const { Text } = Typography;

const JobPage = observer(() => {
  const { t } = useTranslation();
  const { jid } = useParams();
  const navigate = useNavigate();
  const [socket, setSocket] = useState<WebSocket | undefined>();
  const [isSocketOpen, setIsSocketOpen] = useState<boolean>(false);

  useEffect(() => {
    jobStore.reload(jid);
  }, [jid]);

  useEffect(() => {
    if (jobStore.error) {
      navigate("/not-found");
    }
  }, [jobStore.error]);

  /* useEffect(() => {
    const webSocket = new WebSocket(
      `${envStore.env?.wsServerUrl}/jobs/${jid}/return`,
    );
    setSocket(webSocket);
    webSocket.addEventListener("message", (event: MessageEvent<string>) => {
      const parsedJobReturn = JSON.parse(event.data) as JobResult;
      jobStore.addJobReturn(parsedJobReturn);
    });
    webSocket.addEventListener("open", () => {
      setIsSocketOpen(true);
    });
    return () => webSocket.close();
  }, []);

  useEffect(() => {
    const accessToken = authStore.user?.access_token;
    if (accessToken && socket && isSocketOpen) {
      socket.send(accessToken);
    }
  }, [authStore.user, socket, isSocketOpen]); */

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
            title: t("jobs.job-title", { jobId: jid }),
          },
        ]}
      />
      <PageHeader title={t("jobs.job-title", { jobId: jid })} />

      <Descriptions
        bordered
        items={[
          {
            key: "tgt",
            label: t("jobs.table-targets"),
            children: (
              <>
                {(jobStore.job?.tgt as string) ? (
                  <>
                    <Text
                      ellipsis
                      style={{ maxWidth: "200px" }}
                      title={jobStore.job?.tgt as string}
                    >
                      {jobStore.job?.tgt as string}
                    </Text>
                    <CopyToClipboardButton text={jobStore.job?.tgt as string} />
                  </>
                ) : (
                  <Skeleton.Input size="small" />
                )}
              </>
            ),
          },
          {
            key: "tgt_type",
            label: t("jobs.table-target-type"),
            children: jobStore.job?.tgt_type ?? <Skeleton.Input size="small" />,
          },
          {
            key: "user",
            label: t("jobs.table-user"),
            children: jobStore.job?.user ?? <Skeleton.Input size="small" />,
          },
          {
            key: "fun",
            label: t("jobs.table-function"),
            children: jobStore.job?.fun ?? <Skeleton.Input size="small" />,
          },
          {
            key: "arg",
            label: t("jobs.arguments"),
            children: jobStore.isJobLoading ? (
              <Skeleton.Input size="small" />
            ) : jobStore.job?.arg && jobStore.job.arg.length > 0 ? (
              <Flex align="center">
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
            ),
          },
          {
            key: "kwarg",
            label: t("jobs.key-value-arguments"),
            children: jobStore.isJobLoading ? (
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
            ),
          },
        ]}
      />

      <div className={styles.jobReturnTableWrapper}>
        <DefaultJobReturnTable jobReturns={toJS(jobStore.jobReturns)} />
      </div>
    </>
  );
});

export default JobPage;