import { useState } from "react";
import { useTranslation } from "react-i18next";
import ReactJson from "react-json-view";
import { Button, Flex, Popover, message } from "antd";
import { CloseOutlined, CopyOutlined } from "@ant-design/icons";
import { MatIcon } from "saltbox-core/shared/components/mat-icon/mat-icon";

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
            <Button
              type="link"
              icon={<CopyOutlined />}
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(data, null, 2));
                message.success(t("jobs.table-copy-success"));
              }}
            />
            <Button
              type="link"
              icon={<CloseOutlined />}
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
      <Button
        icon={<MatIcon icon="search" />}
        type="link"
        size="small"
        title={t("minions.view")}
      />
    </Popover>
  );
}
