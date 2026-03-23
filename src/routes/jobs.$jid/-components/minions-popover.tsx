import { CloseOutlined, ReloadOutlined } from "@ant-design/icons";
import { JobReturnModel } from "@saltbox/saltbox-core-api-client";
import { BaseActionButton, CopyToClipboardButton, Popover } from "@saltbox/saltbox-frontend-common";
import { Flex, Typography } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { JobModal } from "saltbox-core/shared/components/job-modal/job-modal";
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

  const defaultTrigger = <span className={styles.trigger}>{minions.length}</span>;
  const triggerNode = trigger ?? defaultTrigger;

  if (minions.length === 0) {
    return <>{triggerNode}</>;
  }

  return (
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
            <JobModal
              target={minionNamesCommaSeparated}
              targetType="list"
              fun={jobStore.job?.fun}
              arg={jobStore.job?.arg}
              kwarg={jobStore.job?.kwarg}
              renderButton={(openModal) => (
                <BaseActionButton
                  icon={<ReloadOutlined />}
                  title={t("jobs.replay-job")}
                  onClick={(e) => {
                    e.stopPropagation();
                    openModal();
                  }}
                />
              )}
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
  );
}
