import { CloseOutlined } from "@ant-design/icons";
import { BaseActionButton, CopyToClipboardButton, Popover } from "@saltbox/saltbox-frontend-common";
import { Flex, Tag } from "antd";
import { ReactNode, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import ReactJson from "react-json-view";

export interface JsonPopoverProps {
  data: Record<string, unknown> | unknown[];
  title?: string;
  maxHeight?: string;
  maxWidth?: string;
  placement?: "top" | "bottom" | "bottomRight" | "left" | "right";
  copySuccessMessage?: string;
  tagClassName?: string;
  children: ReactNode;
}

export function JsonPopover({
  data,
  title = "Data",
  maxHeight = "500px",
  maxWidth = "750px",
  placement = "bottomRight",
  copySuccessMessage,
  tagClassName,
  children,
}: JsonPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();

  const handleTagClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const successMessage = copySuccessMessage ?? t("jobs.table-copy-success");

  return (
    <Popover
      content={
        <div style={{ maxHeight, overflow: "auto" }}>
          <ReactJson
            displayDataTypes={false}
            enableClipboard={false}
            name={false}
            displayObjectSize={false}
            src={data}
            collapsed={1}
          />
        </div>
      }
      title={
        <Flex gap={8} justify="space-between" align="center">
          <span>{title}</span>
          <Flex gap={8}>
            <CopyToClipboardButton
              text={JSON.stringify(data, null, 2)}
              successMessage={successMessage}
            />
            <BaseActionButton
              icon={<CloseOutlined />}
              title={t("action-button.close", { ns: "common" })}
              onClick={() => setIsOpen(false)}
            />
          </Flex>
        </Flex>
      }
      trigger="click"
      overlayStyle={{ maxWidth }}
      placement={placement}
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <Tag className={tagClassName} onClick={handleTagClick}>
        {children}
      </Tag>
    </Popover>
  );
}
