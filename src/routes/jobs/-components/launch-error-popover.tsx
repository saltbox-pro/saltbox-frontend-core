import { CloseOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { JobStatus } from "@saltbox/saltbox-core-api-client";
import {
  BaseActionButton,
  CopyToClipboardButton,
  Popover,
  type StatusBadgeSize,
} from "@saltbox/saltbox-frontend-common";
import { Flex } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { JobStatusBadge } from "saltbox-core/shared/components/job-status-badge/job-status-badge";

import styles from "./launch-error-popover.module.css";

type LaunchErrorPopoverProps = {
  errorTypeText: string;
  maxWidth?: string;
  size?: StatusBadgeSize;
};

export function LaunchErrorPopover({
  errorTypeText,
  maxWidth = "300px",
  size,
}: LaunchErrorPopoverProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const { t } = useTranslation();

  if (!errorTypeText) {
    return;
  }

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPopoverOpen(true);
  };

  return (
    <Popover
      content={
        <div
          style={{
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {errorTypeText}
        </div>
      }
      title={
        <Flex justify="space-between" align="center" gap={8}>
          <span>{t("jobs.launch-error-title", "Ошибка запуска команды")}</span>

          <Flex gap={8}>
            <CopyToClipboardButton text={errorTypeText} />

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
      placement="bottom"
      open={isPopoverOpen}
      onOpenChange={setIsPopoverOpen}
      zIndex={500}
    >
      <Flex className={styles.launchErrorPreview} onClick={handleOpen}>
        <JobStatusBadge
          className={styles.launchErrorTag}
          status={JobStatus.LaunchError}
          size={size}
        />
        <InfoCircleOutlined className={styles.launchErrorIcon} />
      </Flex>
    </Popover>
  );
}
