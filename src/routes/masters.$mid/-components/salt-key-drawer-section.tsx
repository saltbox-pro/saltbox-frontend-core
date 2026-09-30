import { CheckOutlined, CloseOutlined, DeleteOutlined } from "@ant-design/icons";
import { SaltKeyStatusType } from "@saltbox/saltbox-core-api-client";
import { Alert, type AlertProps, Button, Flex } from "antd";
import { useTranslation } from "react-i18next";

import type { SaltKeyWithId } from "saltbox-core/store";

import styles from "./salt-key-drawer-section.module.css";
import { SaltKeyStatusTag } from "./salt-key-status-tag";

type SaltKeyAction = "accept" | "reject" | "delete";

const ALERT_TYPE_BY_STATUS: Record<SaltKeyStatusType, AlertProps["type"]> = {
  [SaltKeyStatusType.Unaccepted]: "info",
  [SaltKeyStatusType.Accepted]: "success",
  [SaltKeyStatusType.Rejected]: "warning",
  [SaltKeyStatusType.Denied]: "error",
};

const ACTIONS_BY_STATUS: Record<SaltKeyStatusType, SaltKeyAction[]> = {
  [SaltKeyStatusType.Unaccepted]: ["accept", "reject", "delete"],
  [SaltKeyStatusType.Accepted]: ["reject", "delete"],
  [SaltKeyStatusType.Rejected]: ["accept", "delete"],
  [SaltKeyStatusType.Denied]: ["accept", "delete"],
};

type SaltKeyDrawerSectionProps = {
  saltKey: SaltKeyWithId;
  disabled: boolean;
  onAccept: () => void;
  onReject: () => void;
  onDelete: () => void;
};

export function SaltKeyDrawerSection({
  saltKey,
  disabled,
  onAccept,
  onReject,
  onDelete,
}: SaltKeyDrawerSectionProps) {
  const { t } = useTranslation();

  const actions = ACTIONS_BY_STATUS[saltKey.status] ?? [];

  return (
    <Alert
      className={styles.alert}
      type={ALERT_TYPE_BY_STATUS[saltKey.status] ?? "info"}
      showIcon
      message={
        <Flex gap="small" align="center" wrap>
          {t("master.drawer-key-status")}
          <SaltKeyStatusTag status={saltKey.status} />
        </Flex>
      }
      action={
        <Flex gap="small">
          {actions.includes("accept") && (
            <Button
              size="small"
              type="primary"
              icon={<CheckOutlined />}
              disabled={disabled}
              onClick={onAccept}
            >
              {t("master.drawer-key-accept")}
            </Button>
          )}
          {actions.includes("reject") && (
            <Button size="small" icon={<CloseOutlined />} disabled={disabled} onClick={onReject}>
              {t("master.drawer-key-reject")}
            </Button>
          )}
          {actions.includes("delete") && (
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              disabled={disabled}
              onClick={onDelete}
            >
              {t("master.drawer-key-delete")}
            </Button>
          )}
        </Flex>
      }
    />
  );
}
