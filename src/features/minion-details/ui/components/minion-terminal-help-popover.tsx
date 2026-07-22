import { QuestionCircleOutlined } from "@ant-design/icons";
import { Popover } from "@saltbox/saltbox-frontend-common";
import { Flex, Typography } from "antd";
import { useTranslation } from "react-i18next";

import styles from "./minion-terminal-help-popover.module.css";

export function MinionTerminalHelpPopover() {
  const { t } = useTranslation();

  return (
    <Popover
      content={
        <Flex vertical gap={4} className={styles.helpContent}>
          <Typography.Text>{t("terminal.help-intro")}</Typography.Text>
          <Typography.Text strong>{t("terminal.help-unsupported-title")}</Typography.Text>
          <ul className={styles.helpList}>
            <li>{t("terminal.help-unsupported-interactive")}</li>
            <li>{t("terminal.help-unsupported-user-input")}</li>
            <li>{t("terminal.help-unsupported-shell-state")}</li>
          </ul>
          <Typography.Text>{t("terminal.help-independent-commands")}</Typography.Text>
          <Typography.Text>{t("terminal.help-recommendation")}</Typography.Text>
        </Flex>
      }
      trigger="hover"
      placement="bottomLeft"
    >
      <QuestionCircleOutlined className={styles.helpIcon} />
    </Popover>
  );
}
