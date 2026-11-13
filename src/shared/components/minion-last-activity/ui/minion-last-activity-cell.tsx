import { RelativeTime } from "@saltbox/saltbox-frontend-common";
import { Badge, type BadgeProps } from "antd";
import type { ConfigType } from "dayjs";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";

import type { MinionActivityStatus } from "saltbox-core/shared/helpers/minion-activity";

import styles from "./minion-last-activity-cell.module.css";

export type MinionLastActivityCellProps = {
  date: ConfigType | null | undefined;
  status: MinionActivityStatus;
  fallback?: ReactElement;
};

type ActivityStatusView = {
  color: NonNullable<BadgeProps["color"]>;
  titleKey: string;
};

const ACTIVITY_STATUS_VIEW: Record<MinionActivityStatus, ActivityStatusView> = {
  "never-active": { color: "orange", titleKey: "minions.activity-status.never-active" },
  active: { color: "green", titleKey: "minions.activity-status.active" },
  inactive: { color: "red", titleKey: "minions.activity-status.inactive" },
};

export function MinionLastActivityCell({ date, status, fallback }: MinionLastActivityCellProps) {
  const { t } = useTranslation();
  const { color, titleKey } = ACTIVITY_STATUS_VIEW[status];

  return (
    <>
      <span title={t(titleKey)}>
        <Badge classNames={{ indicator: styles.lastActivityBadge }} color={color} />
      </span>

      <RelativeTime date={date} fallback={fallback} />
    </>
  );
}
