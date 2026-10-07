import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  QuestionCircleOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { MasterStatus } from "@saltbox/saltbox-core-api-client";
import { StatusBadge, type StatusTone } from "@saltbox/saltbox-frontend-common";
import { type ReactNode } from "react";
import { useTranslation } from "react-i18next";

type MasterStatusBadgeProps = {
  status?: MasterStatus | null;
};

type MasterStatusView = {
  tone: StatusTone;
  icon: ReactNode;
  translationKey: string;
};

const MASTER_STATUS_VIEW: Record<MasterStatus, MasterStatusView> = {
  [MasterStatus.New]: {
    tone: "pending",
    icon: <ClockCircleOutlined />,
    translationKey: "masters.table-new",
  },
  [MasterStatus.Accepted]: {
    tone: "success",
    icon: <CheckCircleOutlined />,
    translationKey: "masters.table-accepted",
  },
  [MasterStatus.Rejected]: {
    tone: "danger",
    icon: <CloseCircleOutlined />,
    translationKey: "masters.table-rejected",
  },
  [MasterStatus.KeysStale]: {
    tone: "warning",
    icon: <WarningOutlined />,
    translationKey: "masters.table-keys-stale",
  },
};

export function MasterStatusBadge({ status }: MasterStatusBadgeProps) {
  const { t } = useTranslation();

  if (!status) {
    return null;
  }

  const view = MASTER_STATUS_VIEW[status];

  return (
    <StatusBadge tone={view?.tone ?? "pending"} icon={view?.icon ?? <QuestionCircleOutlined />}>
      {view ? t(view.translationKey) : `${t("masters.table-unknown-status")}: ${status}`}
    </StatusBadge>
  );
}
