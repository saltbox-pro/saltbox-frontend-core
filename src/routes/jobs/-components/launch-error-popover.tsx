import { CloseOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { BaseActionButton, CopyToClipboardButton, Popover } from "@saltbox/saltbox-frontend-common";
import { Flex } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface LaunchErrorPopoverProps {
  errorTypeText: string;
  maxWidth?: string;
}

export function LaunchErrorPopover({ errorTypeText, maxWidth = "400px" }: LaunchErrorPopoverProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const { t } = useTranslation();

  if (!errorTypeText) {
    return;
  }

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
      <InfoCircleOutlined
        style={{
          marginLeft: 8,
          cursor: "pointer",
        }}
        onClick={(e) => {
          e.stopPropagation();
          setIsPopoverOpen(true);
        }}
      />
    </Popover>
  );
}
