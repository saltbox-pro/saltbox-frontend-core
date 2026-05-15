import { CloseOutlined, ReloadOutlined } from "@ant-design/icons";
import { CreateJobRequestTgtTypeEnum, JobReturnModel } from "@saltbox/saltbox-core-api-client";
import { BaseActionButton, CopyToClipboardButton, Popover } from "@saltbox/saltbox-frontend-common";
import { Flex, Typography } from "antd";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { JobModalShell } from "saltbox-core/shared/components/job-modal/job-modal-shell";
import { useJobModalFlowState } from "saltbox-core/shared/components/job-modal/use-job-modal-flow-state";
import { jobStore } from "saltbox-core/store";

import styles from "./minions-popover.module.css";

const { Text } = Typography;

interface MinionsPopoverProps {
  minions: (JobReturnModel | string)[];
  title: string;
  maxWidth?: string;
  trigger?: React.ReactNode;
}

export function MinionsPopover({
  minions,
  title,
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
  } = useJobModalFlowState();

  const handleReplayClick = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      const job = jobStore.job;
      if (!job?.fun) {
        return;
      }
      openConfigureWithFunction(job.fun, {
        target: minionNamesCommaSeparated,
        targetType: CreateJobRequestTgtTypeEnum.List,
        defaultMaster: job.salt_master ?? "",
        ttlSeconds: job.ttl,
      });
    },
    [minionNamesCommaSeparated, openConfigureWithFunction]
  );

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
        repeatBaselineFun={jobStore.job?.fun ?? null}
        repeatBaselineArg={jobStore.job?.arg ?? undefined}
        repeatBaselineKwarg={jobStore.job?.kwarg ?? undefined}
      />
    </>
  );
}
