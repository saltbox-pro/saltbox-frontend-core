import { CloseOutlined, CopyOutlined, ReloadOutlined } from "@ant-design/icons";
import { JobReturnModel } from "@saltbox/saltbox-core-api-client";
import { Popover } from "@saltbox/saltbox-frontend-common";
import { Button, Flex, message, Typography } from "antd";
import { toJS } from "mobx";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { JobModal } from "saltbox-core/shared/components/job-modal/job-modal";
import { jobStore } from "saltbox-core/store";

import styles from "./minions-popover.module.css";

const { Text } = Typography;

interface MinionsPopoverProps {
  minions: (JobReturnModel | string)[];
  title: string;
  maxWidth?: string;
}

export function MinionsPopover({ minions, title, maxWidth = "500px" }: MinionsPopoverProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const { t } = useTranslation();
  const [messageApi, contextHolder] = message.useMessage();

  const minionNames = minions.map((minion) => (typeof minion === "string" ? minion : minion.id));
  const minionNamesCommaSeparated = minionNames.join(",");

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(minionNamesCommaSeparated);
    messageApi.success(t("jobs.table-copy-success"));
  };

  if (minions.length === 0) {
    return <span className={styles.trigger}>{minions.length}</span>;
  }

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
                fun={jobStore.job?.fun}
                arg={jobStore.job?.arg}
                kwarg={jobStore.job?.kwarg}
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
        zIndex={500}
      >
        <span className={styles.trigger}>{minions.length}</span>
      </Popover>
    </>
  );
}
