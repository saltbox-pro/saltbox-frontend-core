import { SyncOutlined } from "@ant-design/icons";
import { JobReturnModel, TaskMinion, TaskMinionStatus } from "@saltbox/saltbox-core-api-client";
import { CopyToClipboardButton, pastTimeByUserTZ, Drawer } from "@saltbox/saltbox-frontend-common";
import { Flex, Spin, Tabs, Tag } from "antd";
import { observer } from "mobx-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import ReactJson from "react-json-view";

import styles from "./minion-view.module.css";

type MinionViewProps = {
  selectedMinion: TaskMinion;
  selectedMinionJobReturns: JobReturnModel[];
  onClose: () => void;
};

type JobReturnViewProps = {
  jobReturn?: JobReturnModel | undefined;
};

type JobReturnItem = {
  objectKey?: string;
  __run_num__?: number;
  result?: boolean;
  [key: string]: unknown;
};

const JobReturnView = ({ jobReturn }: JobReturnViewProps) => {
  const { t } = useTranslation();
  const jobReturnData: Array<JobReturnItem | Object> = [];
  if (Array.isArray(jobReturn)) {
    jobReturnData.push(jobReturn);
  } else if (jobReturn && Object.keys(jobReturn).length > 0) {
    Object.entries(jobReturn).forEach(([key, value]) => {
      jobReturnData.push({
        objectKey: key,
        ...value,
      });
    });
    jobReturnData?.sort(
      (a, b) => (b as JobReturnItem)?.__run_num__ - (a as JobReturnItem)?.__run_num__
    );
  } else {
    return (
      <span>
        <Spin indicator={<SyncOutlined spin />} size="small" /> {t("task.minion.job-running")}
      </span>
    );
  }

  return (
    <>
      {jobReturnData.map((item) => {
        const commandTitle = (item as JobReturnItem)?.objectKey && (
          <div className={styles.jobReturnCommand}>{(item as JobReturnItem)?.objectKey}</div>
        );
        let commandContent = item;

        let containerStyles = styles.jobReturnContainer;
        if (typeof item === "string") {
          containerStyles += " " + styles.jobResultContentNormal;
        } else if (typeof item === "object") {
          delete (commandContent as JobReturnItem)?.objectKey;
        }

        if ((item as JobReturnItem)?.result === true) {
          containerStyles += " " + styles.jobResultContentSuccess;
        }
        if ((item as JobReturnItem)?.result === false) {
          containerStyles += " " + styles.jobResultContentError;
        }

        return (
          <div className={containerStyles} key={(item as JobReturnItem)?.__run_num__}>
            {commandTitle}
            <ReactJson
              displayDataTypes={false}
              enableClipboard={false}
              name={false}
              displayObjectSize={false}
              src={commandContent}
            />
          </div>
        );
      })}
    </>
  );
};

export const MinionView = observer(
  ({ selectedMinion, selectedMinionJobReturns, onClose }: MinionViewProps) => {
    const { t } = useTranslation();

    let minionStatus = (
      <Tag>{`${t("task.minions.table-unknown-code")}: ${selectedMinion?.status}`}</Tag>
    );
    if (selectedMinion?.status === TaskMinionStatus.InWork) {
      minionStatus = <Tag color="blue">{t("task.minions.table-in-work")}</Tag>;
    }
    if (selectedMinion?.status === TaskMinionStatus.Failed) {
      minionStatus = <Tag color="red">{t("task.minions.table-failed")}</Tag>;
    }
    if (selectedMinion?.status === TaskMinionStatus.Success) {
      minionStatus = <Tag color="green">{t("task.minions.table-success")}</Tag>;
    }
    if (selectedMinion?.status === TaskMinionStatus.Pending) {
      minionStatus = <Tag color="yellow">{t("task.minions.table-pending")}</Tag>;
    }

    const tabs = useMemo(
      () => [
        {
          key: "results",
          label: t("task.minion.results"),
          children: (
            <>
              <Flex gap={8} className={styles.minionStatusContainer}>
                <span>
                  <strong>{t("task.minion.job-status")}:</strong> {minionStatus}
                </span>
              </Flex>
              <Flex gap={8} className={styles.minionStatusContainer}>
                <span>
                  <strong>{t("task.minion.finished")}:</strong>{" "}
                  {selectedMinion?.finished_dt ? pastTimeByUserTZ(selectedMinion.finished_dt) : "-"}
                </span>
                <span>
                  <strong>{t("task.minion.last-run")}:</strong>{" "}
                  {selectedMinion?.start_last_dt
                    ? pastTimeByUserTZ(selectedMinion.start_last_dt)
                    : "never"}
                </span>
              </Flex>
              {selectedMinionJobReturns.map((jobResult, jobIndex, jobResults) => {
                return (
                  <div key={jobResult?.jid ?? jobIndex} className={styles.jobResult}>
                    <Flex gap={4} wrap={"wrap"} className={styles.jobResultTitle}>
                      {t("task.minion.job-title", {
                        run: jobResults.length - jobIndex,
                      })}
                      : JID
                      <Flex>
                        {jobResult?.jid ?? ""}
                        <CopyToClipboardButton text={jobResult?.jid ?? ""} />
                      </Flex>
                    </Flex>
                    <div className={styles.jobReturnContent}>
                      <JobReturnView jobReturn={jobResult?.data ?? jobResult} />
                    </div>
                  </div>
                );
              })}
            </>
          ),
        },
      ],
      [
        selectedMinionJobReturns,
        selectedMinion?.status,
        selectedMinion?.finished_dt,
        selectedMinion?.start_last_dt,
        t,
      ]
    );

    return (
      <Drawer
        open={selectedMinion !== undefined}
        onClose={onClose}
        mask={false}
        title={
          <>
            {t("task.minion.title", { minionId: selectedMinion?.minion_id })}
            <CopyToClipboardButton text={selectedMinion?.minion_id ?? ""} />
          </>
        }
        width="35%"
        styles={{
          body: {
            paddingTop: 0,
          },
        }}
      >
        <Tabs items={tabs} size="small" />
      </Drawer>
    );
  }
);
