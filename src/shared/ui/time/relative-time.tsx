import { formatTimeByUserTZ, pastTimeByUserTZ, Popover } from "@saltbox/saltbox-frontend-common";
import { type ConfigType } from "dayjs";
import { type ReactElement } from "react";

interface RelativeTimeProps {
  date: ConfigType | null | undefined;
  fallback?: ReactElement;
}

export const RelativeTime = ({ date, fallback }: RelativeTimeProps) => {
  if (!date) return fallback ?? null;

  return <Popover content={formatTimeByUserTZ(date)}>{pastTimeByUserTZ(date)}</Popover>;
};
