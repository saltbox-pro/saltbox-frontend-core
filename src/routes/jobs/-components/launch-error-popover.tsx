import { CloseOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { BaseActionButton, CopyToClipboardButton, Popover } from "@saltbox/saltbox-frontend-common";
import { Flex, Tag } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import styles from "./launch-error-popover.module.css";

interface LaunchErrorPopoverProps {
  errorTypeText: string;
  tagText: string;
  maxWidth?: string;
}

export function LaunchErrorPopover({
  errorTypeText,
  tagText,
  maxWidth = "300px",
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
        <Tag className={styles.launchErrorTag} color="red">
          {tagText}
        </Tag>
        <InfoCircleOutlined className={styles.launchErrorIcon} />
      </Flex>
    </Popover>
  );
}
