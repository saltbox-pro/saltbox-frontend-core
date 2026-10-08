import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  QuestionCircleOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { SaltKeyStatusType } from "@saltbox/saltbox-core-api-client";
import { StatusBadge, type StatusTone } from "@saltbox/saltbox-frontend-common";
import { type ReactNode } from "react";
import { useTranslation } from "react-i18next";

type SaltKeyStatusBadgeProps = {
  status: SaltKeyStatusType;
};

type SaltKeyStatusView = {
  tone: StatusTone;
  icon: ReactNode;
  translationKey: string;
};

const SALT_KEY_STATUS_VIEW: Record<SaltKeyStatusType, SaltKeyStatusView> = {
  [SaltKeyStatusType.Unaccepted]: {
    tone: "pending",
    icon: <ClockCircleOutlined />,
    translationKey: "master.table-status-unaccepted",
  },
  [SaltKeyStatusType.Accepted]: {
    tone: "success",
    icon: <CheckCircleOutlined />,
    translationKey: "master.table-status-accepted",
  },
  [SaltKeyStatusType.Rejected]: {
    tone: "warning",
    icon: <StopOutlined />,
    translationKey: "master.table-status-rejected",
  },
  [SaltKeyStatusType.Denied]: {
    tone: "danger",
    icon: <CloseCircleOutlined />,
    translationKey: "master.table-status-denied",
  },
};

export function SaltKeyStatusBadge({ status }: SaltKeyStatusBadgeProps) {
  const { t } = useTranslation();
  const view = SALT_KEY_STATUS_VIEW[status];

  return (
    <StatusBadge tone={view?.tone ?? "pending"} icon={view?.icon ?? <QuestionCircleOutlined />}>
      {view ? t(view.translationKey) : `${t("master.table-status-unknown")}: ${status}`}
    </StatusBadge>
  );
}
