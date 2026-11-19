import { useId, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { CollectionHistoryResponse } from "../../model/collection-history";

import styles from "./chart-tooltip-content.module.css";

type HistoryDatum = { timestamp: number; count: number | null };

const HistoryTooltip = ({
  active,
  payload,
  formatDate,
  formatCount,
}: {
  active?: boolean;
  payload?: Array<{ payload?: HistoryDatum }>;
  formatDate: (timestamp: number) => string;
  formatCount: (count: number) => string;
}) => {
  const { t } = useTranslation();
  const point = payload?.[0]?.payload;
  if (!active || !point) {
    return null;
  }
  return (
    <div className={`${styles.chartTooltip} ${styles.historyTooltip}`}>
      <div className={styles.historyTooltipDate}>{formatDate(point.timestamp)}</div>
      <div className={styles.historyTooltipMetric}>
        {point.count === null ? (
          t("dashboard.history-no-observation")
        ) : (
          <>
            <span>{t("dashboard.history-clients")}</span>
            <strong>{formatCount(point.count)}</strong>
          </>
        )}
      </div>
    </div>
  );
};

export const CollectionHistoryChart = ({ response }: { response: CollectionHistoryResponse }) => {
  const { t, i18n } = useTranslation();
  const [isCompact, setIsCompact] = useState(false);
  const gradientId = `collection-history-${useId().replace(/:/g, "")}`;
  const data = useMemo(
    () =>
      response.points.map((point) => ({
        timestamp: Date.parse(point.timestamp),
        count: point.count,
      })),
    [response.points]
  );
  const numberFormat = new Intl.NumberFormat(i18n.language);
  const dateFormat = new Intl.DateTimeFormat(i18n.language, {
    timeZone: response.timezone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const axisFormat = new Intl.DateTimeFormat(i18n.language, {
    timeZone: response.timezone,
    month: response.interval === "month" ? "short" : "2-digit",
    ...(response.interval === "month" ? { year: "numeric" } : { day: "2-digit" }),
    ...(response.interval === "hour" ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
  const domain: [number, number] = [data[0].timestamp, data[data.length - 1].timestamp];

  return (
    <ResponsiveContainer
      width="100%"
      height="100%"
      minWidth={0}
      debounce={60}
      onResize={(width, height) => setIsCompact(width < 420 || height < 150)}
    >
      <AreaChart
        data={data}
        accessibilityLayer
        title={t("dashboard.history-title")}
        margin={{
          top: isCompact ? 6 : 12,
          right: isCompact ? 8 : 12,
          bottom: isCompact ? 0 : 4,
          left: 0,
        }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--ant-color-primary, #1677ff)" stopOpacity={0.2} />
            <stop offset="100%" stopColor="var(--ant-color-primary, #1677ff)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid
          vertical={false}
          stroke="var(--ant-color-border-secondary, #edf0f5)"
          strokeDasharray="3 4"
        />
        <XAxis
          dataKey="timestamp"
          type="number"
          scale="time"
          domain={domain}
          tickFormatter={(timestamp) => axisFormat.format(timestamp)}
          tick={{ fontSize: isCompact ? 10 : 12, fill: "var(--ant-color-text-secondary, #667085)" }}
          axisLine={false}
          tickLine={false}
          tickMargin={isCompact ? 6 : 12}
          minTickGap={isCompact ? 32 : 48}
          interval="preserveStartEnd"
          height={isCompact ? 26 : 38}
        />
        <YAxis
          domain={[0, "auto"]}
          allowDecimals={false}
          width={isCompact ? 44 : 58}
          tickCount={isCompact ? 3 : 5}
          tickFormatter={(count) => numberFormat.format(count)}
          tick={{ fontSize: isCompact ? 10 : 12, fill: "var(--ant-color-text-secondary, #667085)" }}
          axisLine={false}
          tickLine={false}
          tickMargin={8}
        />
        <Tooltip
          filterNull={false}
          isAnimationActive={false}
          cursor={{
            stroke: "var(--ant-color-primary, #1677ff)",
            strokeDasharray: "4 4",
            strokeOpacity: 0.4,
          }}
          content={
            <HistoryTooltip
              formatDate={(value) => dateFormat.format(value)}
              formatCount={(value) => numberFormat.format(value)}
            />
          }
        />
        <Area
          type="linear"
          dataKey="count"
          connectNulls={false}
          stroke="var(--ant-color-primary, #1677ff)"
          strokeWidth={2.25}
          fill={`url(#${gradientId})`}
          fillOpacity={1}
          dot={
            data.length <= 40 || data.filter((point) => point.count !== null).length === 1
              ? { r: 2.5, fill: "var(--ant-color-bg-container, #fff)", strokeWidth: 1.5 }
              : false
          }
          activeDot={{ r: 4, stroke: "var(--ant-color-bg-container, #fff)", strokeWidth: 2 }}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};
