import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Flex, message, Typography } from "antd";
import { CloseOutlined, CopyOutlined, ReloadOutlined } from "@ant-design/icons";
import { JobReturnModel } from "@saltbox/saltbox-core-api-client";
import { Popover } from "@saltbox/saltbox-frontend-common";
import { JobModal } from "saltbox-core/shared/components/job-modal/job-modal";

import styles from "./minions-popover.module.css";

const { Text } = Typography;

interface MinionsPopoverProps {
  minions: (JobReturnModel | string)[];
  title: string;
  maxWidth?: string;
}

export function MinionsPopover({
  minions,
  title,
  maxWidth = "500px",
}: MinionsPopoverProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const { t } = useTranslation();
  const [messageApi, contextHolder] = message.useMessage();

  const minionNames = minions.map((minion) =>
    typeof minion === "string" ? minion : minion.id
  );
  const minionNamesCommaSeparated = minionNames.join(",");

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(minionNamesCommaSeparated);
    messageApi.success(t("jobs.table-copy-success"));
  };

  return (
    <>
      {contextHolder}
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
              <Button
                type="link"
                icon={<CopyOutlined />}
                onClick={handleCopyToClipboard}
                size="small"
                title={t("jobs.copy-list")}
              />
              <JobModal
                target={minionNamesCommaSeparated}
                targetType="list"
                buttonProps={{
                  shape: "circle",
                  icon: <ReloadOutlined />,
                  type: "link",
                  size: "small",
                  showText: false,
                }}
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
        <span className={styles.trigger}>{minions.length}</span>
      </Popover>
    </>
  );
}
