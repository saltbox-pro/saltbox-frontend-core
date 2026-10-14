import { CloseOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { BaseActionButton, CopyToClipboardButton, Popover } from "@saltbox/saltbox-frontend-common";
import { Flex } from "antd";
import { type MouseEvent, type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";

import styles from "./launch-error-popover.module.css";

type LaunchErrorPopoverProps = {
  errorTypeText: string;
  children: ReactNode;
};

export function LaunchErrorPopover({ errorTypeText, children }: LaunchErrorPopoverProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const { t } = useTranslation();

  const handleOpen = (event: MouseEvent) => {
    event.stopPropagation();
    setIsPopoverOpen(true);
  };

  return (
    <Popover
      content={<div className={styles.content}>{errorTypeText}</div>}
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
      overlayStyle={{ maxWidth: "300px" }}
      placement="bottom"
      open={isPopoverOpen}
      onOpenChange={setIsPopoverOpen}
      zIndex={500}
    >
      <Flex className={styles.preview} onClick={handleOpen}>
        {children}
        <InfoCircleOutlined className={styles.icon} />
      </Flex>
    </Popover>
  );
}
