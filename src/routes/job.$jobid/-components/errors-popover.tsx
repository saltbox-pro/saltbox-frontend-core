import { CloseOutlined, CopyOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { Popover, MatIcon } from "@saltbox/saltbox-frontend-common";
import { Button, Flex, message } from "antd";
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
  const [messageApi, contextHolder] = message.useMessage();

  const handleCopyToClipboard = () => {
    const errorsText = errors.map((error) => `${error.minion_id}: ${error.error}`).join("\n");
    navigator.clipboard.writeText(errorsText);
    messageApi.success(t("jobs.table-copy-success"));
  };

  return (
    <>
      {contextHolder}
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
              <Button
                type="link"
                icon={<CopyOutlined />}
                onClick={handleCopyToClipboard}
                size="small"
                title={t("jobs.copy-list")}
              />
              <Button
                type="link"
                icon={<CloseOutlined />}
                onClick={() => setIsPopoverOpen(false)}
                size="small"
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
        <Button
          icon={<MatIcon icon="search" />}
          type="link"
          size="small"
          title={t("minions.view")}
        />
      </Popover>
    </>
  );
}
