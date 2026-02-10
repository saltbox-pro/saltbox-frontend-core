import { CloseOutlined } from "@ant-design/icons";
import {
  BaseActionButton,
  CopyToClipboardButton,
  MatIcon,
  Popover,
} from "@saltbox/saltbox-frontend-common";
import { Button, Flex } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import ReactJson from "react-json-view";

interface JsonPopoverProps {
  data: any;
  title?: string;
  maxHeight?: string;
  maxWidth?: string;
}

export function JsonPopover({
  data,
  title = "Data",
  maxHeight = "500px",
  maxWidth = "700px",
}: JsonPopoverProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);
  const { t } = useTranslation();

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
        <Flex justify="space-between" align="center">
          <span>{title}</span>
          <Flex gap={8}>
            <CopyToClipboardButton
              text={JSON.stringify(data, null, 2)}
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
      <Button icon={<MatIcon icon="search" />} type="link" size="small" title={t("minions.view")} />
    </Popover>
  );
}
