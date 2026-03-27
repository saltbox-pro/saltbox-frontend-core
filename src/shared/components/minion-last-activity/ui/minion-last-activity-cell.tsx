import { RelativeTime } from "@saltbox/saltbox-frontend-common";
import { Badge } from "antd";
import type { ConfigType } from "dayjs";
import type { ReactElement } from "react";

import styles from "./minion-last-activity-cell.module.css";

export type MinionLastActivityCellProps = {
  date: ConfigType | null | undefined;
  lastActivitySeconds?: number | null;
  fallback?: ReactElement;
};

const lastActivitySecondsToBadgeColor = (seconds: number) => {
  if (seconds < 5 * 60) return "green";
  if (seconds < 24 * 60 * 60) return "cyan";
  return "red";
};

export function MinionLastActivityCell(props: MinionLastActivityCellProps) {
  const badgeColor =
    props.lastActivitySeconds != null
      ? lastActivitySecondsToBadgeColor(props.lastActivitySeconds)
      : "orange";

  return (
    <>
      <Badge classNames={{ indicator: styles.lastActivityBadge }} color={badgeColor} />

      <RelativeTime date={props.date} fallback={props.fallback} />
    </>
  );
}
