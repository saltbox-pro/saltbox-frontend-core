import { CloseOutlined, ReloadOutlined } from "@ant-design/icons";
import { CreateJobRequestTgtTypeEnum, JobReturnModel } from "@saltbox/saltbox-core-api-client";
import { BaseActionButton, CopyToClipboardButton, Popover } from "@saltbox/saltbox-frontend-common";
import { Flex, Typography } from "antd";
import type { MessageInstance } from "antd/es/message/interface";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  JobModalShell,
  useJobModalFlowState,
  type JobReplayBaseline,
} from "saltbox-core/features/job-modal";
import { jobStore } from "saltbox-core/store";

import styles from "./minions-popover.module.css";

const { Text } = Typography;

interface MinionsPopoverProps {
  minions: (JobReturnModel | string)[];
  title: string;
  messageApi: MessageInstance;
  maxWidth?: string;
  trigger?: React.ReactNode;
}

export function MinionsPopover({
  minions,
  title,
  messageApi,
  maxWidth = "500px",
  trigger,
}: MinionsPopoverProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const { t } = useTranslation();

  const minionNames = minions.map((minion) =>
    typeof minion === "string" ? minion : (minion.minion_id ?? (minion as { id?: string }).id ?? "")
  );
  const minionNamesCommaSeparated = minionNames.join(",");

  const {
    pickerOpen,
    setPickerOpen,
    configureFunction,
    setConfigureFunction,
    targeting,
    setTargeting,
    openConfigureWithFunction,
  } = useJobModalFlowState(messageApi);
  const [replayBaseline, setReplayBaseline] = useState<JobReplayBaseline | null>(null);

  const handleReplayClick = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      const job = jobStore.job;
      if (!job?.fun) {
        return;
      }
      setReplayBaseline({
        fun: job.fun,
        arg: job.arg ?? undefined,
        kwarg: job.kwarg ?? undefined,
        sourceId: job.template_source_id ?? undefined,
        templateId: job.template_id ?? undefined,
      });
      openConfigureWithFunction(job.fun, {
        target: minionNamesCommaSeparated,
        targetType: CreateJobRequestTgtTypeEnum.List,
        defaultMaster: job.salt_master ?? "",
        ttlSeconds: job.ttl,
      });
    },
    [minionNamesCommaSeparated, openConfigureWithFunction]
  );

  const handleJobModalAfterConfigureClose = useCallback(() => {
    setReplayBaseline(null);
  }, []);

  const defaultTrigger = <span className={styles.trigger}>{minions.length}</span>;
  const triggerNode = trigger ?? defaultTrigger;

  if (minions.length === 0) {
    return <>{triggerNode}</>;
  }

  return (
    <>
      <Popover
        content={
          <div className={styles.content}>
            {minionNames.map((minionName) => (
              <div key={minionName} className={styles.minionItem}>
                <Text code>{minionName}</Text>
              </div>
            ))}
          </div>
        }
        title={
          <Flex justify="space-between" align="center">
            <span>{title}</span>
            <Flex gap={8}>
              <CopyToClipboardButton
                text={minionNamesCommaSeparated}
                successMessage={t("jobs.table-copy-success")}
              />
              <BaseActionButton
                icon={<ReloadOutlined />}
                title={t("jobs.replay-job")}
                onClick={handleReplayClick}
              />
              <BaseActionButton
                icon={<CloseOutlined />}
                title={t("action-button.close", { ns: "common" })}
                onClick={() => setIsPopoverOpen(false)}
              />
            </Flex>
          </Flex>
        }
        trigger="click"
        overlayStyle={{ maxWidth }}
        placement="bottomRight"
        open={isPopoverOpen}
        onOpenChange={setIsPopoverOpen}
        zIndex={500}
      >
        {triggerNode}
      </Popover>

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
}
