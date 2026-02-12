import { CloseOutlined, SearchOutlined } from "@ant-design/icons";
import { BaseActionButton, CopyToClipboardButton, Popover } from "@saltbox/saltbox-frontend-common";
import { Flex } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface ErrorItem {
  minion_id: string;
  error: string;
}

interface ErrorsPopoverProps {
  errors: ErrorItem[];
  maxHeight?: string;
  maxWidth?: string;
}

export function ErrorsPopover({
  errors,
  maxHeight = "500px",
  maxWidth = "700px",
}: ErrorsPopoverProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);
  const { t } = useTranslation();

  const errorsText = errors.map((error) => `${error.minion_id}: ${error.error}`).join("\n");

  return (
    <Popover
      content={
        <div style={{ maxHeight, overflow: "auto" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {errors.map((error, index) => (
              <div key={index} style={{ display: "flex", gap: "8px" }}>
                <span style={{ fontWeight: 600, color: "#faad14", flexShrink: 0 }}>
                  {error.minion_id}:
                </span>
                <span style={{ color: "#8c8c8c", wordBreak: "break-word" }}>{error.error}</span>
              </div>
            ))}
          </div>
        </div>
      }
      title={
        <Flex justify="space-between" align="center">
          <span>{t("jobs.table-errors-found", { count: errors.length })}</span>
          <Flex gap={8}>
            <CopyToClipboardButton
              text={errorsText}
              successMessage={t("jobs.table-copy-success")}
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
    >
      <BaseActionButton icon={<SearchOutlined />} title={t("minions.view")} />
    </Popover>
  );
}
